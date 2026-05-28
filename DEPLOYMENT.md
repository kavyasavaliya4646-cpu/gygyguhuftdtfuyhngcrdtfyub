# Full Deployment Guide

This guide walks you through deploying the GxF Slot Seller Hisab app to production.

## Part 1: Supabase Setup (Database)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Sign Up"
3. Create an account using Email or GitHub

### Step 2: Create a New Project
1. Click "New project" in the dashboard
2. Enter project name: `gxf-slot-seller`
3. Create a strong password (save it)
4. Select region closest to your users
5. Click "Create new project" and wait (2-3 minutes)

### Step 3: Create Database Table
1. In the Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy and paste this SQL:

```sql
CREATE TABLE slot_entries (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  lobby VARCHAR(50) NOT NULL,
  slotPrice INTEGER NOT NULL,
  seller VARCHAR(100) NOT NULL,
  slots INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE slot_entries;
```

4. Click **Run**
5. You should see "Success" message

### Step 4: Get API Keys
1. Go to **Settings > API** (left sidebar)
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxx.supabase.co`)
   - **Anon Key** (public key, safe to expose in frontend)
3. Keep these safe for later

---

## Part 2: GitHub Setup (Code Repository)

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Name: `gxf-slot-seller-hisab`
3. Description: "Admin dashboard for esports slot accounting"
4. Select **Private** (recommended)
5. Click **Create repository**

### Step 2: Push Code to GitHub
In your local terminal, from the project folder:

```bash
cd "c:\Users\kavya_fbwcs2o\Downloads\GxF SLOT SELLER HISAB"
git init
git add .
git commit -m "Initial commit: Supabase + React admin dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gxf-slot-seller-hisab.git
git push -u origin main
```

(Replace `YOUR_USERNAME` with your GitHub username)

---

## Part 3: Vercel Deployment

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Select **GitHub** (easiest option)
4. Authorize Vercel to access your GitHub account

### Step 2: Import Project to Vercel
1. In Vercel dashboard, click **Add New > Project**
2. Select the GitHub repository `gxf-slot-seller-hisab`
3. Click **Import**

### Step 3: Set Environment Variables
1. Under **Environment Variables**, add these:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Paste your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Paste your Supabase Anon Key |

2. Click **Add** for each variable
3. Make sure both are visible in all environments (Production, Preview, Development)

### Step 4: Configure Build Settings
1. Framework Preset: **Vite** (should auto-detect)
2. Build Command: `npm run build` (default)
3. Output Directory: `dist` (default)
4. Install Command: `npm install` (default)

### Step 5: Deploy
1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. Once green checkmark appears, your site is live!

### Step 6: Get Your Live URL
After deployment, you'll see a URL like:
```
https://gxf-slot-seller-hisab.vercel.app
```

This is your production website. Share this link with your team!

---

## Part 4: Local Development (After Deployment)

### Create `.env` File Locally
1. In project folder, create `.env` file:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Install dependencies:
```bash
npm install
```

3. Run locally:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

---

## Part 5: Using the App

### Add Entry
1. Fill in Date, Time, Lobby, Seller, Slot Price, Slots
2. Amount auto-calculates
3. Click **Add Entry**
4. Data saves to Supabase instantly

### Search Data
1. Use text search for lobby/seller name
2. Use date range filters (From/To dates)
3. Search by time
4. Results update in real-time

### View Reports
1. Click **Copy Report** button
2. Paste into WhatsApp/Slack/Email

### Delete Entry
1. Find the entry in the table
2. Click **Delete** button

---

## Part 6: Future Updates

### Making Changes Locally
1. Edit files
2. Test with `npm run dev`
3. Commit & push to GitHub:
```bash
git add .
git commit -m "Your change description"
git push
```

4. Vercel auto-deploys on every push to main branch

### Update Supabase Schema
If you need to add columns later, go to Supabase > SQL Editor and run migrations.

---

## Troubleshooting

### "Cannot connect to database"
- Check if Supabase URL and Anon Key are correct
- Verify environment variables in Vercel settings
- Redeploy from Vercel dashboard

### "Build failed"
- Check Vercel build logs for errors
- Make sure `package.json` has all dependencies
- Run `npm install` locally and verify it works

### "Real-time updates not working"
- Make sure `ALTER PUBLICATION supabase_realtime ADD TABLE slot_entries;` was run
- Check Supabase > Realtime > Tables to confirm `slot_entries` is listed

---

## Security Notes

- ✅ Anon Key is safe to expose (read/write only to specified tables)
- ✅ Supabase handles auth & encryption
- ❌ Never commit `.env` file to GitHub (use `.gitignore`)
- ❌ Never share your Supabase database password

---

## Support

For issues:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- React Docs: https://react.dev
