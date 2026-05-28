# Setup in 10 Minutes - Copy & Paste Guide

## Step 1: Supabase (2 minutes)

Go to: https://supabase.com/sign-up

1. Click **"Sign up with GitHub"** (easiest)
2. Fill project name: `gxf-slot-seller`
3. Create password
4. Click **Create project** and wait

### Get Your Keys

1. Go to **Settings > API** (left sidebar)
2. You'll see:
   - **Project URL** looks like: `https://xxxxxxxxxxx.supabase.co`
   - **Anon Key** looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Copy both and save in a text file**

### Create Database Table

1. Go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste this and click **Run**:

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

ALTER PUBLICATION supabase_realtime ADD TABLE slot_entries;
```

---

## Step 2: GitHub (1 minute)

Go to: https://github.com/new

1. Name: `gxf-slot-seller-hisab`
2. Select **Private**
3. Click **Create repository**

Copy your URL, it looks like:
```
https://github.com/YOUR_USERNAME/gxf-slot-seller-hisab
```

---

## Step 3: Push Code to GitHub (2 minutes)

Open PowerShell in project folder and run:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gxf-slot-seller-hisab.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 4: Vercel (3 minutes)

Go to: https://vercel.com/sign-up

1. Click **Continue with GitHub**
2. Authorize Vercel
3. Click **Add New > Project**
4. Select `gxf-slot-seller-hisab` repository
5. Click **Import**

### Add Environment Variables

Click **Environment Variables** and add these 2:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Paste your Supabase **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Paste your Supabase **Anon Key** |

### Deploy

1. Click **Deploy**
2. Wait for green checkmark (2-5 min)
3. Your app URL appears at the top, like: `https://gxf-slot-seller-hisab.vercel.app`

---

## Step 5: Create Local `.env` File (1 minute)

In your project folder, create file named `.env`:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace with your actual Supabase values.

Then run locally:
```powershell
npm install
npm run dev
```

---

## Done! 🎉

You now have:
- ✅ Live app at: `https://your-app.vercel.app`
- ✅ Local dev at: `http://localhost:5173`
- ✅ Database syncing real-time
- ✅ Auto-deploy when you push code

### Share with Team

Send them this URL:
```
https://your-app.vercel.app
```

They can start adding entries immediately.

### Make Updates

```powershell
# Make code changes, then:
git add .
git commit -m "Your change"
git push
# Vercel auto-deploys!
```
