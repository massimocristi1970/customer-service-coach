# Quick Reference Card

## 🚀 Deployment Status

- [x] ✅ Supabase backend support added
- [x] ✅ Cloudflare frontend support added
- [x] ✅ Local mode still works (no changes required)
- [x] ✅ Data migration script included
- [x] ✅ Complete documentation provided

---

## 📖 Which Guide Should I Read?

| Your Question | Read This |
|--------------|-----------|
| "Should I use local or cloud?" | [LOCAL_VS_CLOUD.md](LOCAL_VS_CLOUD.md) |
| "I want to deploy to cloud now!" | [QUICKSTART_CLOUDFLARE_SUPABASE.md](QUICKSTART_CLOUDFLARE_SUPABASE.md) |
| "I need detailed instructions" | [DEPLOYMENT.md](DEPLOYMENT.md) |
| "How do I track my progress?" | [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) |
| "What changed in this update?" | [SUMMARY.md](SUMMARY.md) |
| "How do I keep using local mode?" | No guide needed - just run `node server.js` |

---

## ⚡ Quick Start: Local Mode (Original)

**Still works - no changes needed!**

```bash
npm install
node server.js
```

Access at: `http://localhost:3000`

---

## ☁️ Quick Start: Cloud Mode (New)

**30-45 minutes total**

### 1. Supabase Setup (15 min)
- Create account at [supabase.com](https://supabase.com)
- Create new project
- Run `supabase/schema.sql` in SQL Editor
- Deploy Edge Functions: `supabase functions deploy search documents logs upload`

### 2. Migrate Data (5 min)
```bash
npm install @supabase/supabase-js
export SUPABASE_URL="your-url"
export SUPABASE_ANON_KEY="your-key"
npm run migrate
```

### 3. Configure Frontend (5 min)
Edit `config.js`:
```javascript
localMode: false,
supabase: {
  url: "your-supabase-url",
  anonKey: "your-anon-key"
}
```

### 4. Deploy to Cloudflare (10 min)
- Push to GitHub
- Connect at [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
- Deploy!

---

## 🔧 Configuration Toggle

### Use Local Mode:
```javascript
// config.js
const config = {
  localMode: true,  // ← Use local server
  // ...
};
```

### Use Cloud Mode:
```javascript
// config.js
const config = {
  localMode: false,  // ← Use Supabase
  supabase: {
    url: "https://xxx.supabase.co",
    anonKey: "your-key"
  },
  // ...
};
```

---

## 📁 Important Files

### Must Configure
- `config.js` - Set your mode and credentials

### Backend (Supabase)
- `supabase/schema.sql` - Database setup
- `supabase/functions/*/index.ts` - API endpoints

### Frontend (Cloudflare)
- `index.html` - Agent search interface
- `admin.html` - Admin panel
- `wrangler.toml` - Cloudflare config

### Tools
- `scripts/migrate-to-supabase.js` - Data migration

---

## 🔑 Where to Get Credentials

### Supabase
1. Go to: Project Settings → API
2. Copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key

### Cloudflare
- After deployment, you'll get: `https://[project-name].pages.dev`

---

## 🆘 Troubleshooting

### "No results found"
- Check `config.js`: Is `localMode` set correctly?
- Check browser console (F12) for errors
- Verify Supabase credentials

### "Function not found"
- Deploy Edge Functions: `supabase functions deploy search documents logs upload`
- Verify in Supabase dashboard → Edge Functions

### "CORS error"
- Edge Functions include CORS headers
- Clear browser cache
- Check function deployment

### Want to roll back?
```javascript
// config.js
localMode: true  // Back to local mode
```
Then run: `node server.js`

---

## 💰 Cost Calculator

### Free Tier Limits
- **Supabase**: 500MB database, 2GB bandwidth/month
- **Cloudflare**: Unlimited requests

### When You'll Pay
- **Supabase Pro** ($25/mo): If you exceed 500MB
- Most small teams stay free forever

### Calculate Your Usage
- Average document size: ~10KB
- 500MB = ~50,000 documents
- Bandwidth: 2GB = ~200,000 searches/month

**Likely cost**: $0/month

---

## 📊 Feature Comparison

| Feature | Local | Cloud |
|---------|-------|-------|
| Cost | $0 | $0-25/mo |
| Setup Time | 5 min | 45 min |
| Remote Access | No | Yes |
| Mobile Access | No | Yes |
| Maintenance | You | Automatic |
| Backups | Manual | Automatic |
| Uptime | Variable | 99.9% |
| HTTPS | No | Yes |
| CDN | No | Yes |

---

## ✅ Deployment Checklist (Ultra-Short)

- [ ] Create Supabase project
- [ ] Run schema.sql
- [ ] Deploy Edge Functions
- [ ] Migrate data
- [ ] Update config.js
- [ ] Deploy to Cloudflare
- [ ] Test everything

**Done!** ✨

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://app.supabase.com
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Supabase Docs**: https://supabase.com/docs
- **Cloudflare Docs**: https://developers.cloudflare.com/pages

---

## 📞 Getting Help

1. Check documentation files in this repo
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
3. Check Supabase/Cloudflare docs
4. Create an issue on GitHub

---

## 🎯 Bottom Line

**Staying local?** 
- No changes needed
- Keep running `node server.js`

**Going cloud?**
- Read: [QUICKSTART_CLOUDFLARE_SUPABASE.md](QUICKSTART_CLOUDFLARE_SUPABASE.md)
- Time: 30-45 minutes
- Cost: $0 (for most teams)
- Benefit: Access anywhere

**Both work great!** Choose what fits your team.

---

## 📱 Print This Card

This reference card contains the essentials. Print it or bookmark for quick access!

**Version**: 2.0 (Cloud Support Added)  
**Last Updated**: 2024  
**Status**: Production Ready ✅
