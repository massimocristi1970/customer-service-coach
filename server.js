const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = 3000;

// Ensure logs directory exists
function ensureLogsDirectory() {
  const logsDir = path.join(__dirname, "logs");
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log("Created logs directory:", logsDir);
    }

    const searchLogFile = path.join(logsDir, "search-logs.json");
    const unansweredLogFile = path.join(logsDir, "unanswered-questions.json");
    const feedbackLogFile = path.join(logsDir, "feedback-logs.json");

    if (!fs.existsSync(searchLogFile)) {
      fs.writeFileSync(searchLogFile, "[]");
      console.log("Created search-logs.json");
    }

    if (!fs.existsSync(unansweredLogFile)) {
      fs.writeFileSync(unansweredLogFile, "[]");
      console.log("Created unanswered-questions.json");
    }

    if (!fs.existsSync(feedbackLogFile)) {
      fs.writeFileSync(feedbackLogFile, "[]");
      console.log("Created feedback-logs.json");
    }

    return true;
  } catch (error) {
    console.error("Error ensuring logs directory:", error);
    return false;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept PDF, TXT, and DOCX files
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "text/plain" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, TXT, and DOCX files are allowed!"), false);
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Load knowledge base
let knowledgeBase = {};
function loadKnowledgeBase() {
  try {
    const data = fs.readFileSync("knowledge-base.json", "utf8");
    knowledgeBase = JSON.parse(data);
  } catch (error) {
    console.log("Knowledge base not found, starting with empty database");
    knowledgeBase = { documents: [] };
    saveKnowledgeBase();
  }
}

function saveKnowledgeBase() {
  try {
    fs.writeFileSync(
      "knowledge-base.json",
      JSON.stringify(knowledgeBase, null, 2)
    );
  } catch (error) {
    console.error("Error saving knowledge base:", error);
  }
}

// File upload endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    let extractedText = "";

    // Extract text based on file type
    if (req.file.mimetype === "application/pdf") {
      // Process PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else if (req.file.mimetype === "text/plain") {
      // Process TXT
      extractedText = fs.readFileSync(filePath, "utf8");
    } else {
      // For DOCX, we'll need a different approach (for now, return error)
      return res.json({
        success: false,
        error: "DOCX processing not yet implemented",
      });
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
      lastUpdated: new Date().toISOString().split("T")[0],
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
      contentLength: extractedText.length,
    });
  } catch (error) {
    console.error("Error processing upload:", error);
    res.json({ success: false, error: error.message });
  }
});

// Extract keywords from text
function extractKeywords(text) {
  const commonWords = [
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "can",
    "shall",
    "this",
    "that",
    "these",
    "those",
    "a",
    "an",
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word) => !commonWords.includes(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

  // Get most frequent words
  return Object.entries(words)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// Updated search endpoint with better logging
app.post("/api/search", (req, res) => {
  const { query } = req.body;

  console.log("Search request received:", query);

  if (!query || query.trim() === "") {
    return res.json({ results: [], message: "Please enter a search term" });
  }

  // Always log the search attempt
  logSearch(query);

  const results = searchDocuments(query.toLowerCase().trim());

  console.log(`Search for "${query}" returned ${results.length} results`);

  // Log as unanswered if no results found
  if (results.length === 0) {
    console.log("Logging as unanswered question:", query);
    logUnansweredQuestion(query);
  }

  res.json({
    results: results,
    query: query,
    total: results.length,
  });
});

// Document management endpoints
app.get("/api/documents", (req, res) => {
  res.json(knowledgeBase);
});

app.post("/api/documents", (req, res) => {
  try {
    const doc = req.body;
    doc.id = Date.now();
    doc.lastUpdated = new Date().toISOString().split("T")[0];
    knowledgeBase.documents.push(doc);
    saveKnowledgeBase();
    res.json({ success: true, id: doc.id });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.delete("/api/documents/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    knowledgeBase.documents = knowledgeBase.documents.filter(
      (doc) => doc.id !== id
    );
    saveKnowledgeBase();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Update document endpoint
app.put("/api/documents/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedDoc = req.body;

    // Find and update the document
    const docIndex = knowledgeBase.documents.findIndex((doc) => doc.id === id);
    if (docIndex === -1) {
      return res.json({ success: false, error: "Document not found" });
    }

    knowledgeBase.documents[docIndex] = updatedDoc;
    saveKnowledgeBase();

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Other endpoints (logging, etc.)
app.post("/api/log-unanswered", (req, res) => {
  const { question, timestamp, agent } = req.body;
  logUnansweredQuestion(question, agent);
  res.json({ success: true });
});

app.post("/api/log-feedback", (req, res) => {
  const { resultId, helpful, timestamp, agent } = req.body;
  logFeedback(resultId, helpful, agent);
  res.json({ success: true });
});

app.get("/api/unanswered", (req, res) => {
  try {
    const data = fs.readFileSync("logs/unanswered-questions.json", "utf8");
    const unanswered = JSON.parse(data);
    res.json(unanswered);
  } catch (error) {
    res.json([]);
  }
});

// ============================================
// IMPROVED LENIENT SEARCH FUNCTION
// ============================================

function searchDocuments(query) {
  // MINIMAL stop words - only filter truly meaningless words
  const stopWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
  ];

  // Extract and clean query words with LENIENT filtering
  const allWords = query
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 2) // Allow shorter words (was > 3)
    .filter((word) => !stopWords.includes(word))
    .filter((word) => word.match(/^[a-zA-Z]+$/));

  console.log("Original query:", query);
  console.log("Search words:", allWords);

  // If still no words, return empty
  if (allWords.length === 0) {
    console.log("No searchable words found");
    return [];
  }

  const results = [];

  knowledgeBase.documents.forEach((doc) => {
    let score = 0;
    let matchedWords = 0;
    const docText = `${doc.title} ${doc.content} ${doc.keywords.join(
      " "
    )}`.toLowerCase();

    // Check for phrase match first (boost scoring)
    const queryPhrase = allWords.join(" ");
    if (docText.includes(queryPhrase)) {
      score += 100; // Major boost for exact phrase
      matchedWords = allWords.length;
    }

    // Check each word individually with generous scoring
    allWords.forEach((word) => {
      let wordFound = false;

      // Title matches (very high value)
      if (doc.title.toLowerCase().includes(word)) {
        score += 20;
        wordFound = true;
      }

      // Keyword matches (high value)
      if (
        doc.keywords &&
        doc.keywords.some((k) => k.toLowerCase().includes(word))
      ) {
        score += 15;
        wordFound = true;
      }

      // Category matches (medium value)
      if (doc.category && doc.category.toLowerCase().includes(word)) {
        score += 10;
        wordFound = true;
      }

      // Content matches (lower value but still counts)
      const contentMatches = (
        doc.content.toLowerCase().match(new RegExp(word, "g")) || []
      ).length;
      if (contentMatches > 0) {
        score += Math.min(contentMatches * 3, 15); // Cap contribution from content
        wordFound = true;
      }

      // Partial word matches (fuzzy matching)
      if (!wordFound && word.length > 4) {
        const partial = word.substring(0, word.length - 1);
        if (docText.includes(partial)) {
          score += 5;
          wordFound = true;
        }
      }

      if (wordFound) {
        matchedWords++;
      }
    });

    // LENIENT REQUIREMENTS:
    // - For 1-2 words: need at least 1 match
    // - For 3+ words: need at least 40% match
    // - Minimum score of 8 (was 15)
    const requiredMatches =
      allWords.length <= 2 ? 1 : Math.ceil(allWords.length * 0.4);
    const minimumScore = 8;

    console.log(
      `"${doc.title}": score=${score}, matched=${matchedWords}/${allWords.length}, required=${requiredMatches}`
    );

    if (matchedWords >= requiredMatches && score >= minimumScore) {
      results.push({
        ...doc,
        score,
        matchedWords,
        matchRatio: matchedWords / allWords.length,
      });
    }
  });

  console.log(`Found ${results.length} matching documents`);

  // Sort by score primarily, then by match ratio
  return results
    .sort((a, b) => {
      if (Math.abs(b.score - a.score) > 10) {
        return b.score - a.score;
      }
      return b.matchRatio - a.matchRatio;
    })
    .slice(0, 5);
}

// Enhanced search logging function
function logSearch(query) {
  try {
    const logFile = path.join(__dirname, "logs", "search-logs.json");
    let logs = [];

    try {
      const data = fs.readFileSync(logFile, "utf8");
      logs = JSON.parse(data);
    } catch (e) {
      logs = [];
    }

    logs.push({
      query: query,
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    console.log(`✓ Logged search: "${query}"`);
  } catch (error) {
    console.error("✗ Error logging search:", error.message);
  }
}

// Enhanced logging function with better error handling
function logUnansweredQuestion(question, agent = "unknown") {
  try {
    const logFile = path.join(__dirname, "logs", "unanswered-questions.json");
    let unanswered = [];

    try {
      const data = fs.readFileSync(logFile, "utf8");
      unanswered = JSON.parse(data);
    } catch (e) {
      unanswered = [];
    }

    if (!Array.isArray(unanswered)) {
      unanswered = [];
    }

    const existing = unanswered.find(
      (item) =>
        item.question && item.question.toLowerCase() === question.toLowerCase()
    );

    if (existing) {
      existing.count += 1;
      existing.lastAsked = new Date().toISOString();
      console.log(
        `✓ Updated unanswered question "${question}" - count: ${existing.count}`
      );
    } else {
      const newEntry = {
        question: question,
        count: 1,
        firstAsked: new Date().toISOString(),
        lastAsked: new Date().toISOString(),
        agent: agent,
      };
      unanswered.push(newEntry);
      console.log(`✓ Added new unanswered question: "${question}"`);
    }

    fs.writeFileSync(logFile, JSON.stringify(unanswered, null, 2));
    console.log(`✓ Successfully saved to unanswered-questions.json`);
  } catch (error) {
    console.error("✗ Error logging unanswered question:", error.message);
  }
}

function logFeedback(resultId, helpful, agent = "unknown") {
  try {
    const logFile = path.join(__dirname, "logs", "feedback-logs.json");
    let logs = [];

    try {
      const data = fs.readFileSync(logFile, "utf8");
      logs = JSON.parse(data);
    } catch (e) {
      logs = [];
    }

    logs.push({
      resultId: resultId,
      helpful: helpful,
      agent: agent,
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    console.log(`✓ Logged feedback: ${helpful ? "helpful" : "not helpful"}`);
  } catch (error) {
    console.error("✗ Error logging feedback:", error.message);
  }
}

// Initialize and start server
loadKnowledgeBase();
ensureLogsDirectory();

app.listen(PORT, () => {
  console.log("Customer Service Coach running at http://localhost:" + PORT);
  console.log(
    "Admin Panel available at http://localhost:" + PORT + "/admin.html"
  );
  console.log(
    "Knowledge base loaded with " +
      (knowledgeBase.documents ? knowledgeBase.documents.length : 0) +
      " documents"
  );
  console.log("Ready to help your agents!");
});
