# Deployment Checklist

Use this checklist to ensure you've completed all deployment steps.

## ☐ Part 1: Supabase Setup

- [ ] Created Supabase account at https://supabase.com
- [ ] Created new project named "gxf-slot-seller"
- [ ] Ran SQL query in SQL Editor to create `slot_entries` table
- [ ] Enabled real-time with `ALTER PUBLICATION` command
- [ ] Copied Project URL from Settings > API
- [ ] Copied Anon Key from Settings > API
- [ ] Saved both values in a text file for later

## ☐ Part 2: GitHub Setup

- [ ] Created GitHub account (if needed)
- [ ] Created new private repository "gxf-slot-seller-hisab"
- [ ] Initialized git in local project folder
- [ ] Added all files with `git add .`
- [ ] Created initial commit with `git commit -m "Initial commit"`
- [ ] Added remote: `git remote add origin https://github.com/YOUR_USERNAME/gxf-slot-seller-hisab.git`
- [ ] Pushed to GitHub with `git push -u origin main`
- [ ] Verified files appear on GitHub.com

## ☐ Part 3: Vercel Deployment

- [ ] Created Vercel account at https://vercel.com
- [ ] Connected Vercel to GitHub account
- [ ] Imported "gxf-slot-seller-hisab" project into Vercel
- [ ] Added environment variable: `VITE_SUPABASE_URL`
- [ ] Added environment variable: `VITE_SUPABASE_ANON_KEY`
- [ ] Set both variables to Production, Preview, and Development
- [ ] Verified build settings:
  - [ ] Framework: Vite
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] Clicked "Deploy"
- [ ] Waited for green checkmark (build success)
- [ ] Tested live URL from Vercel dashboard

## ☐ Part 4: Local Development Setup

- [ ] Created `.env` file in project root
- [ ] Added `VITE_SUPABASE_URL` value
- [ ] Added `VITE_SUPABASE_ANON_KEY` value
- [ ] Ran `npm install`
- [ ] Ran `npm run dev`
- [ ] Opened http://localhost:5173 in browser
- [ ] Tested add/search/delete functionality

## ☐ Part 5: Testing in Production

- [ ] Opened production URL from Vercel
- [ ] Added a test entry
- [ ] Searched for the test entry
- [ ] Updated the test entry
- [ ] Verified data appears in Supabase dashboard
- [ ] Deleted the test entry
- [ ] Tested copying report
- [ ] Verified it works on mobile

## ☐ Part 6: Final Steps

- [ ] Shared production URL with team
- [ ] Documented the URL (save it somewhere safe)
- [ ] Tested with multiple users accessing simultaneously
- [ ] Set up team access if needed
- [ ] Backed up Supabase database
- [ ] Set up monitoring/alerts (optional)

---

## Completed! 🎉

Your app is now live and ready to use.

**Production URL:** https://your-app.vercel.app  
**Admin Dashboard:** Login via this URL

### Need to make changes?

1. Edit code locally
2. Test with `npm run dev`
3. Push to GitHub: `git push`
4. Vercel auto-deploys within 1-2 minutes

### Team access?

Share the production URL with anyone who needs to use the dashboard.

### Questions?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.
