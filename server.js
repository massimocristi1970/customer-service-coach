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

// Updated search endpoint with better logging
app.post('/api/search', (req, res) => {
    const { query } = req.body;
    
    console.log('Search request received:', query);
    
    if (!query || query.trim() === '') {
        return res.json({ results: [], message: 'Please enter a search term' });
    }

    // Always log the search attempt
    logSearch(query);
    
    const results = searchDocuments(query.toLowerCase().trim());
    
    console.log(`Search for "${query}" returned ${results.length} results`);
    
    // Log as unanswered if no results found
    if (results.length === 0) {
        console.log('Logging as unanswered question:', query);
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


// Replace the searchDocuments function in server.js with this STRICT version

function searchDocuments(query) {
    // Define stop words to exclude from search
    const stopWords = [
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
        'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 
        'must', 'can', 'shall', 'this', 'that', 'these', 'those', 'a', 'an',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'name', 'what', 'how', 'when', 'where', 'why', 'who'  // Added common question words
    ];

    // Filter and clean query words
    const queryWords = query.toLowerCase()
        .split(' ')
        .filter(word => word.length > 3) // Only words longer than 3 characters (more strict)
        .filter(word => !stopWords.includes(word)) // Exclude stop words
        .filter(word => word.match(/^[a-zA-Z]+$/)); // Only alphabetic words

    console.log('Original query:', query);
    console.log('Filtered query words:', queryWords);

    // If no meaningful words remain, return empty results
    if (queryWords.length === 0) {
        console.log('No meaningful words found in query - all words were filtered out');
        return [];
    }

    const results = [];

    knowledgeBase.documents.forEach(doc => {
        let score = 0;
        let matchedWords = 0;
        
        // Check for exact phrase match first (highest priority)
        // But only if the phrase contains meaningful words
        const meaningfulQuery = queryWords.join(' ');
        if (meaningfulQuery.length > 3 && doc.content.toLowerCase().includes(meaningfulQuery)) {
            score += 50;
            matchedWords = queryWords.length;
        } else if (meaningfulQuery.length > 3 && doc.title.toLowerCase().includes(meaningfulQuery)) {
            score += 40;
            matchedWords = queryWords.length;
        } else {
            // Count individual meaningful word matches
            queryWords.forEach(word => {
                let wordFound = false;
                
                // Check title matches (high weight) - must be whole word
                const titleMatches = (doc.title.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
                if (titleMatches > 0) {
                    score += titleMatches * 15;
                    wordFound = true;
                }
                
                // Check keyword matches (medium-high weight)
                if (doc.keywords && doc.keywords.some(keyword => 
                    keyword.toLowerCase().includes(word))) {
                    score += 10;
                    wordFound = true;
                }
                
                // Check content matches (lower weight) - must be whole word
                const contentMatches = (doc.content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
                if (contentMatches > 0) {
                    score += contentMatches * 2; // Reduced weight
                    wordFound = true;
                }
                
                // Check category matches (medium weight)
                if (doc.category && doc.category.toLowerCase().includes(word)) {
                    score += 8;
                    wordFound = true;
                }
                
                if (wordFound) {
                    matchedWords++;
                }
            });
        }

        // STRICT REQUIREMENTS:
        // - Must match ALL meaningful words for short queries
        // - Must match at least 75% of words for longer queries
        // - Must have a reasonable score
        const requiredMatches = queryWords.length <= 2 ? queryWords.length : Math.ceil(queryWords.length * 0.75);
        const minimumScore = 15; // Higher minimum score
        
        console.log(`Document "${doc.title}": score=${score}, matchedWords=${matchedWords}/${queryWords.length}, required=${requiredMatches}, minScore=${minimumScore}`);
        
        // Only include results that meet strict criteria
        if (matchedWords >= requiredMatches && score >= minimumScore) {
            results.push({ ...doc, score, matchedWords });
        }
    });

    console.log(`Found ${results.length} matching documents after strict filtering`);
    
    return results.sort((a, b) => {
        // Sort by matched words first, then by score
        if (b.matchedWords !== a.matchedWords) {
            return b.matchedWords - a.matchedWords;
        }
        return b.score - a.score;
    }).slice(0, 5);
}

// Enhanced search logging function
function logSearch(query) {
    try {
        const fs = require('fs');
        const path = require('path');
        const logsDir = path.join(__dirname, 'logs');
        
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const logFile = path.join(logsDir, 'search-logs.json');
        let logs = [];
        
        try {
            if (fs.existsSync(logFile)) {
                const data = fs.readFileSync(logFile, 'utf8');
                if (data.trim()) {
                    logs = JSON.parse(data);
                }
            }
        } catch (readError) {
            console.log('Could not read search logs, starting fresh');
            logs = [];
        }
        
        if (!Array.isArray(logs)) {
            logs = [];
        }
        
        logs.push({
            query: query,
            timestamp: new Date().toISOString()
        });
        
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
        console.log(`Logged search: "${query}"`);
        
    } catch (error) {
        console.error('Error logging search:', error);
    }
}

// Enhanced logging function with better error handling
function logUnansweredQuestion(question, agent = 'unknown') {
    try {
        // Ensure logs directory exists
        const fs = require('fs');
        const path = require('path');
        const logsDir = path.join(__dirname, 'logs');
        
        if (!fs.existsSync(logsDir)) {
            console.log('Creating logs directory...');
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const logFile = path.join(logsDir, 'unanswered-questions.json');
        let unanswered = [];
        
        // Try to read existing file
        try {
            if (fs.existsSync(logFile)) {
                const data = fs.readFileSync(logFile, 'utf8');
                if (data.trim()) {
                    unanswered = JSON.parse(data);
                }
            }
        } catch (readError) {
            console.log('Could not read existing unanswered questions file, starting fresh:', readError.message);
            unanswered = [];
        }

        // Ensure unanswered is an array
        if (!Array.isArray(unanswered)) {
            console.log('Unanswered questions file was corrupted, starting fresh');
            unanswered = [];
        }

        // Check if question already exists (case-insensitive)
        const existing = unanswered.find(item => 
            item.question && item.question.toLowerCase() === question.toLowerCase()
        );
        
        if (existing) {
            existing.count += 1;
            existing.lastAsked = new Date().toISOString();
            console.log(`Updated existing unanswered question "${question}" - count now: ${existing.count}`);
        } else {
            const newEntry = {
                question: question,
                count: 1,
                firstAsked: new Date().toISOString(),
                lastAsked: new Date().toISOString(),
                agent: agent
            };
            unanswered.push(newEntry);
            console.log(`Added new unanswered question: "${question}"`);
        }

        // Write back to file
        fs.writeFileSync(logFile, JSON.stringify(unanswered, null, 2));
        console.log(`Successfully logged unanswered question to ${logFile}`);
        
    } catch (error) {
        console.error('ERROR logging unanswered question:', error);
        console.error('Question was:', question);
        console.error('Error details:', error.message);
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