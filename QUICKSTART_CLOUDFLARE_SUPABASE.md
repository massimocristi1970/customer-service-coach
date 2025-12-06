# Quick Start: Deploy to Cloudflare + Supabase

This is a simplified guide to get you up and running quickly. For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🎯 What You'll Get

- ✅ Backend hosted on Supabase (free tier: 500MB database)
- ✅ Frontend hosted on Cloudflare Pages (free tier: unlimited requests)
- ✅ HTTPS enabled automatically
- ✅ Global CDN for fast loading
- ✅ No server to maintain

**Total time**: 30-45 minutes  
**Cost**: $0 (using free tiers)

---

## Step 1: Set Up Supabase (15 minutes)

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Name it: `customer-service-coach`
4. Choose a database password (save it!)
5. Select region closest to you
6. Click "Create new project"

### 1.2 Create Database Tables
1. In Supabase dashboard, go to **SQL Editor**
2. Copy everything from `supabase/schema.sql`
3. Paste and click "Run"
4. Go to **Table Editor** - you should see 4 tables

### 1.3 Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (get ID from Project Settings)
supabase link --project-ref YOUR_PROJECT_ID

# Deploy all functions
supabase functions deploy search
supabase functions deploy documents
supabase functions deploy logs
supabase functions deploy upload
```

### 1.4 Get Your Credentials
1. In Supabase: **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon public** key (long string)

### 1.5 Multi-Application Support (Optional)

**NEW**: You can run multiple independent applications in the same Supabase project!

**Benefits**:
- 💰 Save money: One project instead of multiple
- 🔒 Complete data isolation between apps
- 📊 Single dashboard to manage everything
- 🚀 Easy to add new applications

**To use this feature**:
1. Each app gets a unique identifier in `config.js`:
   ```javascript
   appName: "customer-service-coach"  // or "sales-support", "hr-kb", etc.
   ```

2. All apps share the same Supabase URL and keys (from Step 1.4)

3. Data is automatically isolated by `app_name` in the database

4. Deploy each app separately on Cloudflare Pages

**Example**: Run customer service, sales support, and HR knowledge base in one Supabase project at $25/month instead of $75/month for three separate projects.

See [DEPLOYMENT.md](DEPLOYMENT.md#multi-application-support) for full details.

---

## Step 2: Migrate Your Data (5 minutes)

### Option A: Automatic Migration (Recommended)
```bash
# Install dependencies
npm install @supabase/supabase-js

# Set your credentials
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Run migration
node scripts/migrate-to-supabase.js
```

### Option B: Manual Import
If you have just a few documents, add them manually:
1. Supabase dashboard → **Table Editor** → **documents**
2. Click "Insert row"
3. Fill in the fields and save

---

## Step 3: Configure Frontend (5 minutes)

Edit `config.js`:

```javascript
const config = {
  localMode: false,  // ← Change this to false!
  
  appName: "customer-service-coach",  // ← Unique identifier for this app
  
  supabase: {
    url: "https://xxx.supabase.co",  // ← Your Supabase URL
    anonKey: "your-anon-key-here",    // ← Your anon key
  },
  // ...
};
```

**Note**: The `appName` enables running multiple apps in one Supabase project. Use the default "customer-service-coach" for a single app, or set unique names for multiple apps (e.g., "sales-support", "hr-knowledge-base").

---

## Step 4: Deploy to Cloudflare (10 minutes)

### Option A: Via Git (Easiest)

1. **Push to GitHub** (if not already):
```bash
git add .
git commit -m "Configure for Cloudflare + Supabase"
git push
```

2. **Deploy on Cloudflare**:
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Click **Pages** → **Create a project**
   - Click "Connect to Git"
   - Select your repository
   - Configure:
     - Build command: (leave empty)
     - Build output directory: `/`
   - Click "Save and Deploy"

3. **Done!** Your site will be live at: `https://[project-name].pages.dev`

### Option B: Direct Upload

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Pages** → **Upload assets**
3. Drag and drop these files:
   - `index.html`
   - `admin.html`
   - `config.js`
4. Click "Deploy"

### Option C: Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=customer-service-coach
```

---

## Step 5: Test Everything (5 minutes)

### Test Your Deployment

1. **Frontend**: Visit your Cloudflare Pages URL
2. **Search**: Try searching for a document
3. **Admin**: Visit `/admin.html` and try:
   - Viewing documents
   - Adding a new document
   - Editing a document
   - Deleting a document

### Troubleshooting

**"No results found" even though you have data:**
- Check `config.js`: Is `localMode: false`?
- Check browser console (F12) for errors
- Verify Supabase credentials are correct

**CORS errors:**
- Edge Functions should have CORS headers (they do by default)
- Clear browser cache and try again

**404 on API calls:**
- Check Edge Functions are deployed: `supabase functions list`
- Verify function names match: search, documents, logs, upload

---

## 🎉 You're Done!

Your customer service coach is now live at:
- **Frontend**: `https://[your-project].pages.dev`
- **Admin Panel**: `https://[your-project].pages.dev/admin.html`

### Next Steps

1. **Custom Domain** (optional):
   - Cloudflare Pages → Settings → Custom domains
   - Add your domain and follow instructions

2. **Security** (recommended):
   - Review RLS policies in Supabase
   - Consider requiring authentication for admin operations
   - Enable rate limiting in Supabase

3. **Monitoring**:
   - Supabase dashboard shows database usage
   - Cloudflare dashboard shows traffic stats

---

## Cost Breakdown

### Free Tier Limits:
- **Supabase**: 500MB database, 2GB bandwidth/month
- **Cloudflare Pages**: Unlimited requests, 500 builds/month

### When You'll Need to Pay:
- **Supabase Pro** ($25/mo): If you exceed 500MB database or need more features
- **Cloudflare**: Stays free for most use cases

### Multi-Application Savings:
- **Single app**: $0-25/month
- **Three apps in one Supabase project**: $0-25/month (shared quotas)
- **Three separate Supabase projects**: $0-75/month (separate quotas)

Using multi-application support can save you $50/month or more!

---

## Going Back to Local

If you need to go back to local hosting:

1. Change `config.js`: `localMode: true`
2. Run: `node server.js`
3. Access at: `http://localhost:3000`

Your Supabase data stays intact - you can switch back anytime!

---

## Support

- 📖 Full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🐛 Issues: Create an issue on GitHub
- 💬 Questions: Check the Supabase and Cloudflare docs

**Happy hosting!** 🚀
