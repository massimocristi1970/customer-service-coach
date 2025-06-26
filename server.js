const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept PDF, TXT, and DOCX files
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'text/plain' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, TXT, and DOCX files are allowed!'), false);
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Load knowledge base
let knowledgeBase = {};
function loadKnowledgeBase() {
    try {
        const data = fs.readFileSync('knowledge-base.json', 'utf8');
        knowledgeBase = JSON.parse(data);
    } catch (error) {
        console.log('Knowledge base not found, starting with empty database');
        knowledgeBase = { documents: [] };
        saveKnowledgeBase();
    }
}

function saveKnowledgeBase() {
    try {
        fs.writeFileSync('knowledge-base.json', JSON.stringify(knowledgeBase, null, 2));
    } catch (error) {
        console.error('Error saving knowledge base:', error);
    }
}

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ success: false, error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileName = req.file.originalname;
        let extractedText = '';

        // Extract text based on file type
        if (req.file.mimetype === 'application/pdf') {
            // Process PDF
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text;
        } else if (req.file.mimetype === 'text/plain') {
            // Process TXT
            extractedText = fs.readFileSync(filePath, 'utf8');
        } else {
            // For DOCX, we'll need a different approach (for now, return error)
            return res.json({ success: false, error: 'DOCX processing not yet implemented' });
        }

        // Create document entry
        const doc = {
            id: Date.now(),
            title: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
            content: extractedText.trim(),
            source: fileName,
            section: "Uploaded Document",
            keywords: extractKeywords(extractedText),
            category: "general",
            lastUpdated: new Date().toISOString().split('T')[0]
        };

        // Add to knowledge base
        knowledgeBase.documents.push(doc);
        saveKnowledgeBase();

        // Clean up uploaded file (optional - you might want to keep originals)
        fs.unlinkSync(filePath);

        res.json({ 
            success: true, 
            id: doc.id,
            title: doc.title,
            contentLength: extractedText.length
        });

    } catch (error) {
        console.error('Error processing upload:', error);
        res.json({ success: false, error: error.message });
    }
});

// Extract keywords from text
function extractKeywords(text) {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that', 'these', 'those', 'a', 'an'];
    
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !commonWords.includes(word))
        .reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
    
    // Get most frequent words
    return Object.entries(words)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
}

// Search endpoint
app.post('/api/search', (req, res) => {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
        return res.json({ results: [], message: 'Please enter a search term' });
    }

    logSearch(query);
    const results = searchDocuments(query.toLowerCase().trim());
    
    if (results.length === 0) {
        logUnansweredQuestion(query);
    }

    res.json({ 
        results: results,
        query: query,
        total: results.length 
    });
});

// Document management endpoints
app.get('/api/documents', (req, res) => {
    res.json(knowledgeBase);
});

app.post('/api/documents', (req, res) => {
    try {
        const doc = req.body;
        doc.id = Date.now();
        doc.lastUpdated = new Date().toISOString().split('T')[0];
        knowledgeBase.documents.push(doc);
        saveKnowledgeBase();
        res.json({ success: true, id: doc.id });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.delete('/api/documents/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        knowledgeBase.documents = knowledgeBase.documents.filter(doc => doc.id !== id);
        saveKnowledgeBase();
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Update document endpoint
app.put('/api/documents/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedDoc = req.body;
        
        // Find and update the document
        const docIndex = knowledgeBase.documents.findIndex(doc => doc.id === id);
        if (docIndex === -1) {
            return res.json({ success: false, error: 'Document not found' });
        }
        
        knowledgeBase.documents[docIndex] = updatedDoc;
        saveKnowledgeBase();
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Other endpoints (logging, etc.)
app.post('/api/log-unanswered', (req, res) => {
    const { question, timestamp, agent } = req.body;
    logUnansweredQuestion(question, agent);
    res.json({ success: true });
});

app.post('/api/log-feedback', (req, res) => {
    const { resultId, helpful, timestamp, agent } = req.body;
    logFeedback(resultId, helpful, agent);
    res.json({ success: true });
});

app.get('/api/unanswered', (req, res) => {
    try {
        const data = fs.readFileSync('logs/unanswered-questions.json', 'utf8');
        const unanswered = JSON.parse(data);
        res.json(unanswered);
    } catch (error) {
        res.json([]);
    }
});

// Search function
function searchDocuments(query) {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const results = [];

    knowledgeBase.documents.forEach(doc => {
        let score = 0;
        
        if (doc.content.toLowerCase().includes(query)) score += 20;
        if (doc.title.toLowerCase().includes(query)) score += 15;
        
        queryWords.forEach(word => {
            if (doc.keywords && doc.keywords.some(keyword => keyword.includes(word))) {
                score += 10;
            }
            if (doc.content.toLowerCase().includes(word)) {
                score += 5;
            }
            if (doc.title.toLowerCase().includes(word)) {
                score += 8;
            }
            if (doc.category && doc.category.toLowerCase().includes(word)) {
                score += 6;
            }
        });

        if (score > 0) {
            results.push({ ...doc, score });
        }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Logging functions
function logSearch(query) {
    try {
        let logs = [];
        try {
            const data = fs.readFileSync('logs/search-logs.json', 'utf8');
            logs = JSON.parse(data);
        } catch (e) {}
        
        logs.push({
            query: query,
            timestamp: new Date().toISOString()
        });
        
        fs.writeFileSync('logs/search-logs.json', JSON.stringify(logs, null, 2));
    } catch (error) {
        console.log('Error logging search:', error);
    }
}

function logUnansweredQuestion(question, agent = 'unknown') {
    try {
        let unanswered = [];
        try {
            const data = fs.readFileSync('logs/unanswered-questions.json', 'utf8');
            unanswered = JSON.parse(data);
        } catch (e) {}

        const existing = unanswered.find(item => item.question.toLowerCase() === question.toLowerCase());
        
        if (existing) {
            existing.count += 1;
            existing.lastAsked = new Date().toISOString();
        } else {
            unanswered.push({
                question: question,
                count: 1,
                firstAsked: new Date().toISOString(),
                lastAsked: new Date().toISOString(),
                agent: agent
            });
        }

        fs.writeFileSync('logs/unanswered-questions.json', JSON.stringify(unanswered, null, 2));
        console.log('Logged unanswered question: "' + question + '"');
    } catch (error) {
        console.log('Error logging unanswered question:', error);
    }
}

function logFeedback(resultId, helpful, agent = 'unknown') {
    try {
        let logs = [];
        try {
            const data = fs.readFileSync('logs/feedback-logs.json', 'utf8');
            logs = JSON.parse(data);
        } catch (e) {}
        
        logs.push({
            resultId: resultId,
            helpful: helpful,
            agent: agent,
            timestamp: new Date().toISOString()
        });
        
        fs.writeFileSync('logs/feedback-logs.json', JSON.stringify(logs, null, 2));
    } catch (error) {
        console.log('Error logging feedback:', error);
    }
}

// Initialize and start server
loadKnowledgeBase();

app.listen(PORT, () => {
    console.log('Customer Service Coach running at http://localhost:' + PORT);
    console.log('Admin Panel available at http://localhost:' + PORT + '/admin.html');
    console.log('Knowledge base loaded with ' + (knowledgeBase.documents ? knowledgeBase.documents.length : 0) + ' documents');
    console.log('Ready to help your agents!');
});