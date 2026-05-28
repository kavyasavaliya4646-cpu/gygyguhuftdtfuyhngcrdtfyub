# GxF Slot Seller Hisab

Admin dashboard for esports scrim slot accounting with real-time data sync.

## Quick Start

**New to this?** Start here: [QUICKSTART.md](./QUICKSTART.md)

**Full deployment guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

## Features

✅ Add/edit/delete slot sales entries  
✅ Search by date, time, lobby, or seller  
✅ Real-time data sync with Supabase  
✅ Generate and copy reports  
✅ Admin dashboard view  

## Tech Stack

- **Frontend**: React + Vite
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Real-time**: Supabase Realtime subscriptions

## Local Development

1. Create `.env` file with Supabase credentials
2. Run `npm install`
3. Run `npm run dev`
4. Open http://localhost:5173

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

## File Structure

```
├── src/
│   ├── App.jsx              # Main React component
│   ├── supabase.js          # Supabase client config
│   ├── main.jsx             # Entry point
│   └── style.css            # Tailwind-like styles
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies
├── .env.example             # Environment variables template
├── vercel.json              # Vercel deployment config
├── DEPLOYMENT.md            # Full deployment guide
├── QUICKSTART.md            # Quick reference
└── README.md                # This file
```
