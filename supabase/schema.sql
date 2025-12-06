-- Customer Service Coach Database Schema for Supabase
-- Run this in your Supabase SQL Editor to create the database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    app_name TEXT NOT NULL DEFAULT 'customer-service-coach',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    section TEXT,
    keywords TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'general',
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search logs table
CREATE TABLE IF NOT EXISTS search_logs (
    id BIGSERIAL PRIMARY KEY,
    app_name TEXT NOT NULL DEFAULT 'customer-service-coach',
    query TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unanswered questions table
CREATE TABLE IF NOT EXISTS unanswered_questions (
    id BIGSERIAL PRIMARY KEY,
    app_name TEXT NOT NULL DEFAULT 'customer-service-coach',
    question TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    first_asked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_asked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agent TEXT DEFAULT 'unknown',
    UNIQUE(app_name, question)
);

-- Feedback logs table
CREATE TABLE IF NOT EXISTS feedback_logs (
    id BIGSERIAL PRIMARY KEY,
    app_name TEXT NOT NULL DEFAULT 'customer-service-coach',
    result_id BIGINT,
    helpful BOOLEAN NOT NULL,
    agent TEXT DEFAULT 'unknown',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_documents_app_name ON documents(app_name);
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_documents_content ON documents USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(app_name, category);
CREATE INDEX IF NOT EXISTS idx_search_logs_app_name ON search_logs(app_name);
CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp ON search_logs(app_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_app_name ON unanswered_questions(app_name);
CREATE INDEX IF NOT EXISTS idx_unanswered_questions_count ON unanswered_questions(app_name, count DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_logs_app_name ON feedback_logs(app_name);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unanswered_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security requirements)
-- For production, you may want to restrict these further

-- Documents policies
CREATE POLICY "Enable read access for all users" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON documents
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON documents
    FOR DELETE USING (true);

-- Search logs policies
CREATE POLICY "Enable insert for all users" ON search_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON search_logs
    FOR SELECT USING (true);

-- Unanswered questions policies
CREATE POLICY "Enable read for authenticated users" ON unanswered_questions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON unanswered_questions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON unanswered_questions
    FOR UPDATE USING (true);

-- Feedback logs policies
CREATE POLICY "Enable insert for all users" ON feedback_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON feedback_logs
    FOR SELECT USING (true);

-- Function to increment unanswered question count
CREATE OR REPLACE FUNCTION increment_unanswered_count(
    p_question TEXT,
    p_agent TEXT DEFAULT 'unknown',
    p_app_name TEXT DEFAULT 'customer-service-coach'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO unanswered_questions (app_name, question, count, agent, first_asked, last_asked)
    VALUES (p_app_name, p_question, 1, p_agent, NOW(), NOW())
    ON CONFLICT (app_name, question)
    DO UPDATE SET
        count = unanswered_questions.count + 1,
        last_asked = NOW(),
        agent = EXCLUDED.agent;
END;
$$;

-- Function to search documents (PostgreSQL full-text search)
CREATE OR REPLACE FUNCTION search_documents(
    search_query TEXT,
    p_app_name TEXT DEFAULT 'customer-service-coach'
)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    content TEXT,
    source TEXT,
    section TEXT,
    keywords TEXT[],
    category TEXT,
    last_updated DATE,
    score REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.content,
        d.source,
        d.section,
        d.keywords,
        d.category,
        d.last_updated,
        (
            ts_rank(to_tsvector('english', d.title), plainto_tsquery('english', search_query)) * 4 +
            ts_rank(to_tsvector('english', d.content), plainto_tsquery('english', search_query)) +
            ts_rank(to_tsvector('english', array_to_string(d.keywords, ' ')), plainto_tsquery('english', search_query)) * 2
        )::REAL as score
    FROM documents d
    WHERE 
        d.app_name = p_app_name
        AND (
            to_tsvector('english', d.title) @@ plainto_tsquery('english', search_query)
            OR to_tsvector('english', d.content) @@ plainto_tsquery('english', search_query)
            OR to_tsvector('english', array_to_string(d.keywords, ' ')) @@ plainto_tsquery('english', search_query)
        )
    ORDER BY score DESC
    LIMIT 5;
END;
$$;
