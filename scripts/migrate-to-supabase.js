#!/usr/bin/env node

/**
 * Migration Script: JSON Knowledge Base to Supabase
 * 
 * This script migrates your existing knowledge-base.json to Supabase PostgreSQL database
 * 
 * Usage:
 *   1. Install dependencies: npm install @supabase/supabase-js
 *   2. Set environment variables or edit the config below
 *   3. Run: node scripts/migrate-to-supabase.js
 */

const fs = require('fs');
const path = require('path');

// Configuration - Update these with your Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Validate configuration
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ Error: Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  console.error('   Either:');
  console.error('   1. Set environment variables:');
  console.error('      export SUPABASE_URL=your-url');
  console.error('      export SUPABASE_ANON_KEY=your-key');
  console.error('   2. Or edit this script and replace the placeholders');
  process.exit(1);
}

// Import Supabase client
let createClient;
try {
  const supabase = require('@supabase/supabase-js');
  createClient = supabase.createClient;
} catch (error) {
  console.error('❌ Error: @supabase/supabase-js is not installed');
  console.error('   Run: npm install @supabase/supabase-js');
  process.exit(1);
}

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateData() {
  try {
    // Read knowledge-base.json
    const knowledgeBasePath = path.join(__dirname, '..', 'knowledge-base.json');
    
    if (!fs.existsSync(knowledgeBasePath)) {
      console.error('❌ Error: knowledge-base.json not found');
      console.error('   Expected location:', knowledgeBasePath);
      process.exit(1);
    }

    console.log('📖 Reading knowledge-base.json...');
    const knowledgeBaseContent = fs.readFileSync(knowledgeBasePath, 'utf8');
    const knowledgeBase = JSON.parse(knowledgeBaseContent);

    if (!knowledgeBase.documents || !Array.isArray(knowledgeBase.documents)) {
      console.error('❌ Error: Invalid knowledge-base.json format');
      console.error('   Expected structure: { "documents": [...] }');
      process.exit(1);
    }

    const documents = knowledgeBase.documents;
    console.log(`✅ Found ${documents.length} documents to migrate\n`);

    if (documents.length === 0) {
      console.log('⚠️  No documents to migrate');
      return;
    }

    // Ask for confirmation
    console.log('📋 Documents to be migrated:');
    documents.slice(0, 5).forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.title}`);
    });
    if (documents.length > 5) {
      console.log(`   ... and ${documents.length - 5} more`);
    }
    console.log('');

    // Migrate each document
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docNumber = `[${i + 1}/${documents.length}]`;

      try {
        // Remove old ID field if it exists
        const { id, ...docData } = doc;

        // Prepare document data for Supabase
        const supabaseDoc = {
          title: docData.title || 'Untitled',
          content: docData.content || '',
          source: docData.source || null,
          section: docData.section || null,
          keywords: docData.keywords || [],
          category: docData.category || 'general',
          last_updated: docData.lastUpdated || new Date().toISOString().split('T')[0],
        };

        // Insert into Supabase
        const { data, error } = await supabaseClient
          .from('documents')
          .insert(supabaseDoc)
          .select();

        if (error) {
          console.error(`❌ ${docNumber} Error migrating "${doc.title}":`, error.message);
          errorCount++;
        } else {
          console.log(`✅ ${docNumber} Migrated: ${doc.title}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ ${docNumber} Exception migrating "${doc.title}":`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount} documents`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed: ${errorCount} documents`);
    }
    console.log('='.repeat(60));

    if (successCount === documents.length) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Verify your data in Supabase dashboard');
      console.log('   2. Update config.js with your Supabase credentials');
      console.log('   3. Set localMode: false in config.js');
      console.log('   4. Deploy your frontend to Cloudflare Pages');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the failed documents.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
console.log('🚀 Starting migration to Supabase...\n');
migrateData();
