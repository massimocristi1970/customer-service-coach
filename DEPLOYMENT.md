# Deployment Guide: Supabase Backend + Cloudflare Frontend

This guide will help you deploy the Customer Service Coach application with:
- **Backend**: Supabase (PostgreSQL database + Edge Functions)
- **Frontend**: Cloudflare Pages (static hosting)

## Architecture Overview

```
┌─────────────────────┐
│  Cloudflare Pages   │  ← Frontend (HTML/CSS/JS)
│  (Static Hosting)   │
└──────────┬──────────┘
           │
           │ HTTPS
           ▼
┌─────────────────────┐
│ Supabase Edge       │  ← API Layer
│ Functions           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Supabase PostgreSQL │  ← Database
│ Database            │
└─────────────────────┘
```

---

## Part 1: Setting Up Supabase Backend

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: customer-service-coach
   - **Database Password**: (choose a strong password and save it)
   - **Region**: (choose closest to your users)
5. Click "Create new project" and wait for setup to complete (1-2 minutes)

### Step 2: Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this repository
4. Paste it into the SQL Editor
5. Click "Run" to execute the script
6. Verify tables were created by going to **Table Editor** - you should see:
   - documents
   - search_logs
   - unanswered_questions
   - feedback_logs

### Step 3: Migrate Your Existing Data (Optional)

If you have existing data in `knowledge-base.json`, you can import it:

1. Go to **Table Editor** → **documents**
2. Click "Insert" → "Insert row"
3. Manually add each document, or use the SQL Editor:

```sql
INSERT INTO documents (title, content, source, section, keywords, category)
VALUES 
('Your Title', 'Your Content', 'Source', 'Section', ARRAY['keyword1', 'keyword2'], 'general');
```

Alternatively, create a migration script (see `scripts/migrate-data.js` section below).

### Step 4: Deploy Edge Functions

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_ID
```
(Find your project ID in: Project Settings → General → Reference ID)

4. Deploy the Edge Functions:
```bash
supabase functions deploy search
supabase functions deploy documents
supabase functions deploy logs
supabase functions deploy upload
```

#### Option B: Manual Deployment via Dashboard

1. Go to **Edge Functions** in your Supabase dashboard
2. Click "Create a new function"
3. For each function (search, documents, logs, upload):
   - Name it (e.g., "search")
   - Copy the code from `supabase/functions/[function-name]/index.ts`
   - Paste and deploy

### Step 5: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (the public key, safe for browser use)

---

## Part 2: Setting Up Cloudflare Frontend

### Step 1: Prepare Your Frontend

1. Update `config.js` with your Supabase credentials:

```javascript
const config = {
  localMode: false,  // Set to false for production
  
  supabase: {
    url: "https://xxxxx.supabase.co",  // Your Supabase URL
    anonKey: "your-anon-key-here",      // Your Supabase anon key
  },
  // ... rest of the config
};
```

2. Ensure the frontend HTML files reference `config.js`:

Add this line to the `<head>` section of `index.html` and `admin.html` if not already present:
```html
<script src="config.js"></script>
```

### Step 2: Deploy to Cloudflare Pages

#### Option A: Deploy via Git (Recommended)

1. Push your code to GitHub (if not already done)

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)

3. Navigate to **Pages** → **Create a project**

4. Click "Connect to Git"

5. Select your repository: `customer-service-coach`

6. Configure build settings:
   - **Project name**: customer-service-coach
   - **Production branch**: main (or your branch name)
   - **Build command**: (leave empty - no build needed for static site)
   - **Build output directory**: `/` (root directory)

7. Click "Save and Deploy"

#### Option B: Deploy via Wrangler CLI

1. Install Wrangler:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy:
```bash
wrangler pages deploy . --project-name=customer-service-coach
```

#### Option C: Direct Upload

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click "Create a project" → "Upload assets"
3. Upload these files:
   - `index.html`
   - `admin.html`
   - `config.js`
   - Any CSS/JS files
4. Click "Deploy site"

### Step 3: Configure Environment Variables (if needed)

If you want to keep credentials out of `config.js`:

1. In Cloudflare Pages dashboard, go to your project
2. Click **Settings** → **Environment variables**
3. Add:
   - `SUPABASE_URL`: your Supabase URL
   - `SUPABASE_ANON_KEY`: your anon key

Then update `config.js` to read from environment variables (requires a build step).

---

## Part 3: Update Frontend API Calls

The frontend needs to be updated to call Supabase Edge Functions instead of the local Express server.

### Files to Update:

You'll need to update the API calls in:
- `index.html` (search functionality)
- `admin.html` (document management)

### Example API Call Changes:

#### Before (Local Express):
```javascript
fetch('http://localhost:3000/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: searchQuery })
})
```

#### After (Supabase):
```javascript
const apiUrl = window.appConfig.getApiUrl();
const headers = window.appConfig.getHeaders();

fetch(`${apiUrl}/search`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({ query: searchQuery })
})
```

### Specific Endpoint Mappings:

| Old Express Endpoint | New Supabase Endpoint |
|---------------------|----------------------|
| `POST /api/search` | `POST /functions/v1/search` |
| `GET /api/documents` | `GET /functions/v1/documents` |
| `POST /api/documents` | `POST /functions/v1/documents` |
| `PUT /api/documents/:id` | `PUT /functions/v1/documents/:id` |
| `DELETE /api/documents/:id` | `DELETE /functions/v1/documents/:id` |
| `POST /api/upload` | `POST /functions/v1/upload` |
| `GET /api/unanswered` | `GET /functions/v1/logs?action=unanswered` |
| `POST /api/log-unanswered` | `POST /functions/v1/logs?action=unanswered` |
| `POST /api/log-feedback` | `POST /functions/v1/logs?action=feedback` |

---

## Part 4: Testing Your Deployment

### Test the Backend:

1. Test Search Endpoint:
```bash
curl -X POST \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/search' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"query":"test"}'
```

2. Test Documents Endpoint:
```bash
curl -X GET \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/documents' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

### Test the Frontend:

1. Visit your Cloudflare Pages URL (e.g., `https://customer-service-coach.pages.dev`)
2. Try searching for a document
3. Open browser console (F12) to check for errors
4. Go to admin page (`/admin.html`)
5. Try adding/editing/deleting a document

---

## Part 5: Data Migration Script (Optional)

Create a script to migrate data from `knowledge-base.json` to Supabase:

```javascript
// scripts/migrate-data.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  const knowledgeBase = JSON.parse(
    fs.readFileSync('knowledge-base.json', 'utf8')
  );

  for (const doc of knowledgeBase.documents) {
    const { id, ...docData } = doc; // Remove old ID
    const { data, error } = await supabase
      .from('documents')
      .insert(docData);
    
    if (error) {
      console.error('Error inserting document:', doc.title, error);
    } else {
      console.log('Migrated:', doc.title);
    }
  }
  
  console.log('Migration complete!');
}

migrateData();
```

Run with:
```bash
node scripts/migrate-data.js
```

---

## Security Considerations

### Row Level Security (RLS)

The provided schema enables RLS with basic policies. For production, consider:

1. **Restricting writes to authenticated users only**:
```sql
-- Update the insert/update/delete policies
CREATE POLICY "Enable insert for authenticated users only" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

2. **Using API Keys for service accounts**: Create a service role key in Supabase for admin operations

3. **Rate limiting**: Enable Supabase rate limiting in Project Settings

### Environment Variables

- Never commit real credentials to Git
- Use `.env.example` as a template
- Store actual credentials in Cloudflare environment variables

---

## Troubleshooting

### Common Issues:

#### 1. CORS Errors
- Ensure Edge Functions include proper CORS headers
- Check that `Access-Control-Allow-Origin` is set to `*` or your domain

#### 2. Authentication Errors
- Verify your `SUPABASE_ANON_KEY` is correct
- Check that RLS policies allow public access for your use case

#### 3. 404 on Edge Functions
- Confirm functions are deployed: `supabase functions list`
- Check function names match your API calls

#### 4. Empty Search Results
- Verify data was migrated to documents table
- Check table policies allow SELECT for anonymous users

### Debug Mode:

Enable console logging in your browser:
```javascript
// Add to config.js
debug: true
```

Check Supabase logs:
1. Go to **Logs** in Supabase dashboard
2. Select "Edge Functions" to see function execution logs

---

## Cost Estimates

### Supabase:
- **Free tier**: 500MB database, 50MB file storage, 2GB bandwidth
- **Pro tier** ($25/mo): 8GB database, 100GB file storage, 50GB bandwidth

### Cloudflare Pages:
- **Free tier**: 500 builds/month, unlimited requests
- **Custom domains**: Free on all plans

**Expected cost for small team**: $0-25/month

---

## Multi-Application Support

### Overview

You can run multiple independent applications within a single Supabase project while maintaining complete data isolation. This approach significantly reduces costs while keeping your applications separate.

### Benefits

- ✅ **Cost Savings**: One Supabase project instead of multiple ($25/month vs $75/month for 3 apps)
- ✅ **Data Isolation**: Each app only sees its own records via `app_name` column
- ✅ **Simple Management**: Single dashboard for all applications
- ✅ **Easy Scaling**: Add new applications without creating new Supabase projects
- ✅ **Production Ready**: Follows Supabase best practices for multi-tenant applications

### How It Works

All database tables include an `app_name` column that identifies which application owns each record:

```sql
-- Each table has an app_name column
SELECT * FROM documents WHERE app_name = 'customer-service-coach';
SELECT * FROM documents WHERE app_name = 'sales-support-coach';
```

### Setting Up Additional Applications

#### Step 1: Configure the New Application

For each additional application, update `config.js` with a unique `appName`:

```javascript
const config = {
  appName: "sales-support-coach",  // Different for each app
  
  supabase: {
    url: "https://xxxxx.supabase.co",  // SAME across all apps
    anonKey: "your-anon-key",          // SAME across all apps
  },
  // ... rest of config
};
```

#### Step 2: Deploy the Application

Deploy to Cloudflare Pages (same steps as Part 2 above). Each application can have its own deployment:

- `customer-service-coach.pages.dev`
- `sales-support-coach.pages.dev`
- `hr-knowledge-base.pages.dev`

#### Step 3: Verify Data Isolation

Test that each application only sees its own data:

```bash
# Test App 1 - Should only see its own documents
curl -X GET \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/documents' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'X-App-Name: customer-service-coach'

# Test App 2 - Should only see different documents
curl -X GET \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/documents' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'X-App-Name: sales-support-coach'
```

### Configuration per Application

Each application instance needs:

1. **Unique `appName`** in `config.js`
2. **Same Supabase credentials** (URL and anon key)
3. **Separate Cloudflare Pages deployment** (or separate directory)

### Monitoring Per-App Usage

Query database usage per application:

```sql
-- Count documents per app
SELECT app_name, COUNT(*) as document_count
FROM documents
GROUP BY app_name
ORDER BY document_count DESC;

-- Count searches per app (last 30 days)
SELECT app_name, COUNT(*) as search_count
FROM search_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY app_name
ORDER BY search_count DESC;

-- Count unanswered questions per app
SELECT app_name, SUM(count) as total_unanswered
FROM unanswered_questions
GROUP BY app_name
ORDER BY total_unanswered DESC;

-- Storage used per app (approximate)
SELECT 
  app_name,
  COUNT(*) as documents,
  SUM(LENGTH(content)) / 1024 / 1024 as mb_used
FROM documents
GROUP BY app_name
ORDER BY mb_used DESC;
```

### Important Considerations

1. **Shared Quotas**: All applications share the same Supabase free tier limits:
   - 500MB database storage
   - 2GB bandwidth/month
   - 50MB file storage

2. **No Automatic Separation**: The schema enforces data isolation, but you must configure each app correctly with a unique `appName`.

3. **Billing**: If you exceed free tier limits, you'll be upgraded to Pro ($25/month) for ALL applications.

4. **RLS Policies**: The current RLS policies allow public access. Consider implementing app-specific authentication if needed.

### Migration from Separate Projects

If you currently have multiple Supabase projects and want to consolidate:

1. Export data from each project
2. Add `app_name` column during import
3. Update each application's `config.js` with unique `appName`
4. Test thoroughly before decommissioning old projects

### Example: Three Applications, One Project

```
Project: xxxxx.supabase.co
├── customer-service-coach (app_name: "customer-service-coach")
│   ├── 50 documents
│   ├── 200 search logs
│   └── cloudflare: cs-coach.pages.dev
├── sales-support-coach (app_name: "sales-support-coach")
│   ├── 30 documents
│   ├── 150 search logs
│   └── cloudflare: sales-support.pages.dev
└── hr-knowledge-base (app_name: "hr-knowledge-base")
    ├── 40 documents
    ├── 100 search logs
    └── cloudflare: hr-kb.pages.dev

Total cost: $0 (if within free tier) or $25/month (Pro tier)
Instead of: $75/month (3 separate Pro projects)
```

---

## Rollback to Local Setup

If you need to go back to local hosting:

1. Set `localMode: true` in `config.js`
2. Run `node server.js` locally
3. Access at `http://localhost:3000`

---

## Next Steps

1. ✅ Set up custom domain in Cloudflare Pages
2. ✅ Configure HTTPS (automatic with Cloudflare)
3. ✅ Set up monitoring and alerts in Supabase
4. ✅ Configure backups in Supabase (Settings → Database)
5. ✅ Train your team on the new URLs

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Issues**: Create an issue in this repository

---

**Congratulations!** 🎉 Your Customer Service Coach is now hosted on Supabase and Cloudflare!
