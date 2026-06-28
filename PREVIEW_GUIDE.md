# 🖥️ How to Preview Your WBIPAS Web App

Since you're working with WBIPAS in a sandbox environment, here's how to preview it on your local machine.

---

## 🚀 Quick Start (5 Minutes)

### Method 1: Local Development (Recommended)

**Step 1: Clone the Repository**
```bash
# Open your terminal/command prompt
git clone https://github.com/sandeshl9/WBIPAS.git
cd WBIPAS
```

**Step 2: Install Dependencies**
```bash
npm install
# This will install all required packages
# Takes about 2-3 minutes
```

**Step 3: Set Up Environment Variables**
```bash
# Copy the example environment file
cp .env.example .env

# Open .env and add your Supabase credentials
# (You'll need a free Supabase account)
```

**Step 4: Start Development Server**
```bash
npm run dev
```

**Step 5: Open Browser**
```
Your app will be running at:
http://localhost:5173

The terminal will show you the exact URL
```

---

## 🌐 Alternative: Online Preview (Vercel/Netlify)

If you want to preview without local setup:

### Option A: Vercel (Easiest)

1. **Go to:** https://vercel.com
2. **Sign in** with GitHub
3. **Click:** "New Project"
4. **Select:** Your WBIPAS repository
5. **Add Environment Variables:**
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. **Click:** "Deploy"

**Result:** Your app will be live at `https://your-project.vercel.app`

### Option B: Netlify

1. **Go to:** https://netlify.com
2. **Sign in** with GitHub
3. **Click:** "Add new site" → "Import an existing project"
4. **Select:** Your WBIPAS repository
5. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Add Environment Variables** (same as Vercel)
7. **Click:** "Deploy site"

---

## 📦 What You Need

### Required:
- **Node.js** 18+ (Download: https://nodejs.org)
- **npm** (comes with Node.js)
- **Git** (Download: https://git-scm.com)

### Optional (for full functionality):
- **Supabase Account** (Free tier: https://supabase.com)
  - You'll need this for the database backend
  - Takes 5 minutes to set up

---

## 🗄️ Setting Up Supabase (Optional but Recommended)

If you want the app to work with real data:

**Step 1: Create Supabase Project**
1. Go to https://supabase.com
2. Sign up (free)
3. Click "New Project"
4. Choose a name (e.g., "WBIPAS")
5. Generate a strong password
6. Choose a region (closest to you)
7. Wait 2 minutes for setup

**Step 2: Get Your Credentials**
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. Paste them in your `.env` file

**Step 3: Run Database Migrations**
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy content from `supabase/migrations/001_initial_schema.sql`
4. Paste and run
5. Repeat for `002_views_and_functions.sql`
6. Repeat for `003_row_level_security.sql`

**Done!** Your database is ready.

---

## 🎨 What You'll See

### Without Database (Demo Mode):
- ✅ Beautiful UI with all components
- ✅ Navigation between pages
- ✅ Forms with validation
- ✅ Charts and visualizations
- ⚠️ Mock data (not real)

### With Database (Full Mode):
- ✅ Everything above, plus:
- ✅ Real data persistence
- ✅ Recommendation engine working
- ✅ Excel import functional
- ✅ Complete audit trail
- ✅ Multi-user support

---

## 🖼️ Preview Screenshots

Once running, you'll see:

### 1. Dashboard
- 10 KPI cards with metrics
- Interactive charts (weekly trend, capacity heatmap)
- Recent assignments timeline
- Quick action buttons

### 2. Associate Management
- Advanced table with search and filters
- Sortable columns
- Action menu per row
- Add/Edit forms

### 3. Project Assignment Wizard
- 4-step guided flow
- Project information entry
- Recommendation display
- Confirmation screen

### 4. Opening Balance Import
- Manual entry form
- Excel/CSV upload
- Validation with preview
- Import summary

---

## 🛠️ Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run linter
npm run lint
```

---

## 🌍 Accessing from Other Devices

Once your local server is running:

### Same Network:
1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
2. Look for something like `192.168.1.x`
3. On another device, open: `http://192.168.1.x:5173`

### Remote Access:
Use ngrok (free):
```bash
# Install ngrok
npm install -g ngrok

# In another terminal
ngrok http 5173
```
You'll get a public URL like: `https://abc123.ngrok.io`

---

## 🐛 Troubleshooting

### "Cannot find module" errors:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port 5173 already in use:
```bash
# Vite will automatically try port 5174, 5175, etc.
# Or specify a different port:
npm run dev -- --port 3000
```

### "Module not found: Can't resolve '@/...'"
```bash
# This shouldn't happen, but if it does:
# Check tsconfig.json has the path alias configured
```

### Environment variables not working:
```bash
# Make sure .env file is in project root
# Variable names must start with VITE_
# Restart dev server after changing .env
```

---

## 📱 Mobile Preview

The app is fully responsive! Test on mobile:

1. **Start local server** (see above)
2. **Find your IP address**
3. **Open on mobile browser:** `http://YOUR_IP:5173`

Or use browser dev tools:
- Chrome: F12 → Toggle device toolbar (Ctrl+Shift+M)
- Firefox: F12 → Responsive Design Mode (Ctrl+Shift+M)

---

## 🎯 What to Test

### Key Features:
1. **Dashboard**
   - Check all 10 KPI cards load
   - Verify charts render correctly
   - Test quick action buttons

2. **Associate Management**
   - Try searching by name
   - Use filters (availability, capacity)
   - Sort columns
   - Open action menu

3. **Project Assignment Wizard**
   - Go through all 4 steps
   - Test form validation
   - Try the "Back" button

4. **Opening Balance**
   - Test manual entry
   - Try CSV template download
   - Attempt a file upload

5. **Forms**
   - Add Associate form
   - Test validation errors
   - Check required fields

---

## 🚀 Deploy to Production

Once you're ready to go live:

### Vercel (Recommended):
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
# Add environment variables when asked
```

### Netlify:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Follow prompts
```

### Self-Hosted:
```bash
# Build production bundle
npm run build

# Upload 'dist' folder to your server
# Serve with nginx, Apache, or Node.js
```

---

## 📊 Performance Tips

For the best preview experience:

1. **Use Chrome or Firefox** (best React DevTools support)
2. **Install React DevTools** browser extension
3. **Open DevTools** (F12) to see console logs
4. **Enable "Preserve log"** in DevTools console
5. **Check Network tab** to see API calls

---

## 🎨 Customization

Want to customize before previewing?

### Change Theme Colors:
Edit `src/styles/design-tokens.ts`

### Change App Name:
Edit `index.html` (title tag)

### Add/Remove Features:
Check `src/routes/index.tsx` for all routes

---

## 📞 Need Help?

If you run into issues:

1. **Check the logs** in terminal
2. **Open browser console** (F12)
3. **Read error messages** carefully
4. **Check GitHub Issues**: https://github.com/sandeshl9/WBIPAS/issues
5. **Review documentation**: All `.md` files in repository

---

## ✅ Quick Checklist

Before previewing:

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created (optional but recommended)
- [ ] Development server started (`npm run dev`)
- [ ] Browser opened to `localhost:5173`

---

## 🎉 You're All Set!

Once you complete the Quick Start above, you'll see the WBIPAS interface in your browser with:

✨ **Beautiful modern UI** (Linear/Notion quality)  
✨ **Smooth animations** (Framer Motion)  
✨ **Interactive charts** (Recharts)  
✨ **Advanced tables** with search/filter/sort  
✨ **Responsive design** (works on mobile)  
✨ **Dark mode support** (toggle in header)  

**Enjoy exploring your enterprise-grade workload management system!** 🚀

---

**Last Updated:** June 28, 2026  
**Version:** 1.0.0  
**Status:** Ready for Preview
