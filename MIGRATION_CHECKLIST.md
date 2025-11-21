# Migration Checklist: Local → Supabase + Cloudflare

Use this checklist to track your migration progress.

## Pre-Migration (Local Setup)

- [ ] Current local setup is working (`node server.js`)
- [ ] You have access to `knowledge-base.json`
- [ ] You've backed up your current data
- [ ] You've noted how many documents you have

---

## Phase 1: Supabase Setup (15-20 minutes)

### Account & Project
- [ ] Created Supabase account at [supabase.com](https://supabase.com)
- [ ] Created new project named `customer-service-coach`
- [ ] Saved database password securely
- [ ] Project fully initialized (check dashboard)

### Database Schema
- [ ] Opened SQL Editor in Supabase dashboard
- [ ] Copied contents from `supabase/schema.sql`
- [ ] Executed SQL script successfully
- [ ] Verified 4 tables exist in Table Editor:
  - [ ] `documents`
  - [ ] `search_logs`
  - [ ] `unanswered_questions`
  - [ ] `feedback_logs`

### Credentials
- [ ] Copied Project URL from Settings → API
- [ ] Copied anon/public key from Settings → API
- [ ] Saved both values securely (you'll need them)

### Edge Functions
- [ ] Installed Supabase CLI: `npm install -g supabase`
- [ ] Logged in: `supabase login`
- [ ] Linked project: `supabase link --project-ref YOUR_PROJECT_ID`
- [ ] Deployed search function: `supabase functions deploy search`
- [ ] Deployed documents function: `supabase functions deploy documents`
- [ ] Deployed logs function: `supabase functions deploy logs`
- [ ] Deployed upload function: `supabase functions deploy upload`
- [ ] Verified all functions in Supabase dashboard → Edge Functions

---

## Phase 2: Data Migration (5-10 minutes)

### Preparation
- [ ] Installed migration dependency: `npm install @supabase/supabase-js`
- [ ] Updated `scripts/migrate-to-supabase.js` with credentials OR
- [ ] Set environment variables:
  ```bash
  export SUPABASE_URL="your-url"
  export SUPABASE_ANON_KEY="your-key"
  ```

### Migration
- [ ] Ran migration: `node scripts/migrate-to-supabase.js`
- [ ] Migration completed without errors
- [ ] Verified document count matches original
- [ ] Spot-checked a few documents in Supabase Table Editor

---

## Phase 3: Frontend Configuration (5 minutes)

### Update Config
- [ ] Opened `config.js` in your editor
- [ ] Changed `localMode: false` (line 7)
- [ ] Added your Supabase URL (line 11)
- [ ] Added your Supabase anon key (line 12)
- [ ] Saved the file
- [ ] Verified config.js is NOT in .gitignore (it's safe to commit)

### Test Locally (Optional but Recommended)
- [ ] Stopped local server if running
- [ ] Opened `index.html` directly in browser (file:// protocol)
- [ ] Verified it connects to Supabase (check browser console)
- [ ] Tried a search - got results from Supabase

---

## Phase 4: Cloudflare Deployment (10-15 minutes)

### Git Repository
- [ ] All changes committed to git
- [ ] Pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is accessible online

### Cloudflare Account
- [ ] Created account at [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Navigated to Pages section
- [ ] Verified account is active

### Deployment
Choose one method:

#### Method A: Git Integration (Recommended)
- [ ] Clicked "Connect to Git"
- [ ] Authorized Cloudflare to access your repository
- [ ] Selected your repository
- [ ] Configured build settings:
  - [ ] Build command: (empty)
  - [ ] Build output directory: `/`
- [ ] Clicked "Save and Deploy"
- [ ] Waited for deployment to complete
- [ ] Noted your Pages URL (e.g., `xxx.pages.dev`)

#### Method B: Direct Upload
- [ ] Clicked "Upload assets"
- [ ] Uploaded files: `index.html`, `admin.html`, `config.js`
- [ ] Clicked "Deploy site"
- [ ] Noted your Pages URL

#### Method C: Wrangler CLI
- [ ] Installed Wrangler: `npm install -g wrangler`
- [ ] Logged in: `wrangler login`
- [ ] Deployed: `wrangler pages deploy . --project-name=customer-service-coach`
- [ ] Noted your Pages URL

---

## Phase 5: Testing & Verification (10 minutes)

### Frontend Tests
- [ ] Visited your Cloudflare Pages URL
- [ ] Page loads without errors (check console)
- [ ] Search box is visible
- [ ] Tried searching for a known document
- [ ] Search returned results
- [ ] Results display correctly

### Admin Panel Tests
- [ ] Visited `/admin.html` on your Pages URL
- [ ] Admin panel loads correctly
- [ ] Can see list of documents
- [ ] Clicked "Edit" on a document
- [ ] Made a change and saved it
- [ ] Change persisted after refresh
- [ ] Tried adding a new document
- [ ] New document appears in list
- [ ] Tried deleting a test document
- [ ] Document was removed

### Analytics Tests
- [ ] Clicked "Analytics" tab in admin
- [ ] Can see document count
- [ ] Performed a search that returns no results
- [ ] Checked that it appears in "Unanswered Questions"

### Cross-Device Test (if applicable)
- [ ] Tested on desktop browser
- [ ] Tested on mobile browser
- [ ] Both work correctly

---

## Phase 6: Final Configuration (5 minutes)

### Security Review
- [ ] Reviewed Supabase RLS policies in dashboard
- [ ] Considered if you need authentication
- [ ] Enabled rate limiting if desired
- [ ] Reviewed who has access to Supabase dashboard

### Performance
- [ ] Page loads quickly (should be < 2 seconds)
- [ ] Search is responsive
- [ ] Admin operations complete quickly

### Backup
- [ ] Enabled automatic backups in Supabase (Settings → Database)
- [ ] Backed up local `knowledge-base.json` just in case
- [ ] Documented your Supabase credentials securely

---

## Phase 7: Team Rollout (10-30 minutes)

### Communication
- [ ] Prepared announcement for team
- [ ] Noted the new URLs:
  - [ ] Frontend: `https://xxx.pages.dev`
  - [ ] Admin: `https://xxx.pages.dev/admin.html`
- [ ] Prepared any training materials needed

### Training
- [ ] Showed team the new URL
- [ ] Demonstrated that search works the same
- [ ] Showed admins the admin panel
- [ ] Addressed any questions

### Monitoring
- [ ] Bookmarked Supabase dashboard for monitoring
- [ ] Bookmarked Cloudflare dashboard for analytics
- [ ] Set up any alerts you need

---

## Optional Enhancements

### Custom Domain
- [ ] Purchased/configured custom domain
- [ ] Added to Cloudflare Pages (Settings → Custom domains)
- [ ] Verified SSL certificate is active
- [ ] Updated team with new domain

### Advanced Security
- [ ] Configured Supabase authentication
- [ ] Updated RLS policies for authenticated users
- [ ] Added login page to admin panel
- [ ] Tested authentication flow

---

## Rollback Plan (Just in Case)

If anything goes wrong:

- [ ] Changed `config.js` back to `localMode: true`
- [ ] Ran `node server.js` locally
- [ ] Verified local setup works
- [ ] Can troubleshoot cloud setup at leisure

---

## Success Criteria ✅

You've successfully migrated when:

- ✅ Frontend is accessible at your Cloudflare URL
- ✅ Search returns accurate results
- ✅ Admin panel works for CRUD operations
- ✅ Team is using the new system
- ✅ No local server running
- ✅ All data is in Supabase

---

## Post-Migration

### Week 1
- [ ] Monitor error rates in browser consoles
- [ ] Check Supabase logs for issues
- [ ] Gather feedback from team
- [ ] Document any issues and solutions

### Ongoing
- [ ] Regular backups (automated in Supabase)
- [ ] Monitor database size
- [ ] Review unanswered questions regularly
- [ ] Add new documents as needed

---

## Need Help?

- 📖 Full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🚀 Quick guide: [QUICKSTART_CLOUDFLARE_SUPABASE.md](QUICKSTART_CLOUDFLARE_SUPABASE.md)
- 🐛 Issues: Create issue on GitHub
- 💬 Supabase: [supabase.com/docs](https://supabase.com/docs)
- 💬 Cloudflare: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)

---

**Congratulations on migrating to the cloud!** 🎉
