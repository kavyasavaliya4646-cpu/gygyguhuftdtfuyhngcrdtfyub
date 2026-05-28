# Quick Start - Deployment Commands

## 1. Supabase Setup (5 minutes)
```bash
# Go to https://supabase.com > Sign Up
# Create project, then run in SQL Editor:

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

ALTER PUBLICATION supabase_realtime ADD TABLE slot_entries;

# Copy: Project URL + Anon Key from Settings > API
```

## 2. GitHub Setup (2 minutes)
```bash
cd "c:\Users\kavya_fbwcs2o\Downloads\GxF SLOT SELLER HISAB"

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gxf-slot-seller-hisab.git
git push -u origin main
```

## 3. Vercel Deployment (3 minutes)
```
1. Go to https://vercel.com > Sign Up with GitHub
2. Click "Add New > Project"
3. Select: gxf-slot-seller-hisab
4. Add Environment Variables:
   - VITE_SUPABASE_URL = (paste from Supabase)
   - VITE_SUPABASE_ANON_KEY = (paste from Supabase)
5. Click "Deploy"
6. Wait for green checkmark
7. Share the URL!
```

## 4. Local Development
```bash
# Create .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Install & run
npm install
npm run dev
```

## 5. Make Updates
```bash
# Edit files, then:
git add .
git commit -m "Your change"
git push
# Vercel auto-deploys!
```

---

**Done!** Your app is now live at: `https://your-app.vercel.app`

For detailed steps, see [DEPLOYMENT.md](./DEPLOYMENT.md)
