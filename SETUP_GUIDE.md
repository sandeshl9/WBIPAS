# WBIPAS Setup Guide

Complete step-by-step guide to set up WBIPAS from scratch.

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- ✅ **npm** 9.x or higher (comes with Node.js)
- ✅ **Git** (for cloning the repository)
- ✅ **Supabase Account** ([Sign up free](https://supabase.com))
- ✅ **Code Editor** (VS Code recommended)

---

## Part 1: Project Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd wbipas

# Verify you're in the correct directory
ls -la
# You should see: package.json, src/, supabase/, etc.
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This will take a few minutes
# You should see a successful installation message
```

### Step 3: Verify Installation

```bash
# Check that dependencies are installed
ls node_modules/

# You should see folders like:
# react, react-dom, @supabase/supabase-js, vite, etc.
```

---

## Part 2: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `WBIPAS` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to be ready

### Step 2: Get API Credentials

1. In your Supabase project dashboard
2. Click **"Settings"** (gear icon in left sidebar)
3. Click **"API"**
4. Find these two values:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 3: Configure Environment Variables

1. In your project root, copy the example file:

```bash
cp .env.example .env
```

2. Open `.env` in your code editor

3. Replace the placeholders:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Save the file

**⚠️ Important**: Never commit `.env` to Git! It's already in `.gitignore`.

### Step 4: Run Database Migrations

You need to set up the database schema.

**Option A: Using SQL Editor (Recommended)**

1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"**
3. Open `supabase/migrations/20240101000000_initial_schema.sql` from your project
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. Wait for "Success" message
8. Repeat for `20240101000001_rls_policies.sql`
9. (Optional) Repeat for `20240101000002_seed_data.sql` for test data

**Option B: Using Supabase CLI** (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

### Step 5: Verify Database Setup

1. In Supabase dashboard, click **"Table Editor"**
2. You should see these tables:
   - users
   - associates
   - capacities
   - projects
   - assignments
   - recommendations
   - opening_balance
   - opening_balance_import_logs
   - audit_logs
   - settings

If you see all tables, ✅ **database setup is complete!**

---

## Part 3: Create First User

Since the database is empty, you need to create your first user.

### Step 1: Create User via Supabase Dashboard

1. In Supabase dashboard, click **"Authentication"** in left sidebar
2. Click **"Users"** tab
3. Click **"Add user"** button
4. Select **"Create new user"**
5. Fill in:
   - **Email**: your-email@example.com
   - **Password**: choose a strong password (save this!)
   - **Auto Confirm User**: ✅ Check this box
6. Click **"Create user"**

### Step 2: Verify User Creation

1. Click **"Table Editor"** → **"users"** table
2. You should see one row with your email
3. Note the `role` column should be `manager`

If not present:

1. Click **"SQL Editor"**
2. Run this query (replace with your user ID):

```sql
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, 'Your Name', 'manager'
FROM auth.users
WHERE email = 'your-email@example.com';
```

---

## Part 4: Start the Application

### Step 1: Start Development Server

```bash
npm run dev
```

You should see:

```
VITE v5.0.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Step 2: Open in Browser

1. Open browser to `http://localhost:5173`
2. You should see the **WBIPAS Login Page**

### Step 3: Log In

1. Enter the email and password you created in Supabase
2. Click **"Sign In"**
3. You should be redirected to the **Dashboard**

✅ **If you see the dashboard, congratulations! Setup is complete!**

---

## Part 5: Add Sample Data

To test the system, add some sample data.

### Step 1: Add Associates

1. Navigate to **Associates** in the sidebar
2. Click **"Add Associate"**
3. Fill in:
   - **Employee ID**: EMP001
   - **Name**: Alice Anderson
   - **Email**: alice@example.com
   - **Weekly Capacity**: 5
   - **Department**: Engineering (optional)
4. Click **"Save"**
5. Repeat to add 3-5 more associates

### Step 2: Add Projects

1. Navigate to **Projects**
2. Click **"Create Project"**
3. Fill in:
   - **Project ID**: PRJ001
   - **Project Name**: Website Redesign
   - **Client**: Acme Corp
   - **Project Date**: Choose today's date
   - **Priority**: High
4. Click **"Create"**
5. Repeat to add 3-5 more projects

### Step 3: Test Assignment

1. Find an unassigned project
2. Click **"Get Recommendation"**
3. You should see:
   - Recommended associate
   - Explanation of why they were chosen
4. Click **"Accept"** to assign
5. Project status changes to **"Assigned"**

✅ **If assignment works, the system is fully functional!**

---

## Part 6: Verify All Features

### Checklist

- [ ] Login works
- [ ] Dashboard displays
- [ ] Can create associates
- [ ] Can create projects
- [ ] Recommendation engine works
- [ ] Assignment works
- [ ] Dark mode toggle works
- [ ] Navigation works
- [ ] Can view reports
- [ ] Can access settings

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Cause**: `.env` file doesn't exist or is misconfigured

**Solution**:
1. Verify `.env` file exists in project root
2. Check variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### Issue: Login fails with "Invalid login credentials"

**Cause**: User doesn't exist or password is wrong

**Solution**:
1. Go to Supabase → Authentication → Users
2. Verify user exists
3. Try resetting password via Supabase dashboard
4. Ensure user is confirmed (not pending)

### Issue: "No associates found" when getting recommendation

**Cause**: No active, available associates in database

**Solution**:
1. Go to Associates page
2. Add at least one associate
3. Verify `is_active` = true and `is_available` = true
4. Try recommendation again

### Issue: Tables don't appear in Supabase

**Cause**: Migrations didn't run successfully

**Solution**:
1. Go to Supabase → SQL Editor
2. Check for errors in previous runs
3. Run migrations again in order:
   - 20240101000000_initial_schema.sql
   - 20240101000001_rls_policies.sql
4. If errors persist, delete tables and run again

### Issue: Dashboard shows no data

**Cause**: No data in database yet

**Solution**:
1. This is expected for new installation
2. Add associates and projects (see Part 5)
3. Dashboard will populate automatically

### Issue: Dark mode doesn't work

**Cause**: Theme state not saving or CSS classes not applied

**Solution**:
1. Clear browser localStorage
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Toggle dark mode again
4. Check browser console for errors

### Issue: Port 5173 already in use

**Cause**: Another process is using the port

**Solution**:
```bash
# Stop the process
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Issue: npm install fails

**Cause**: Node.js version too old or npm cache corruption

**Solution**:
```bash
# Check Node version
node --version
# Should be 18.x or higher

# Clear npm cache
npm cache clean --force

# Try again
npm install
```

---

## Next Steps

Now that your system is set up:

1. **Read the Documentation**
   - [README.md](./README.md) - Overview and features
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
   - [DATABASE_SCHEMA.md](./supabase/DATABASE_SCHEMA.md) - Database details

2. **Customize Settings**
   - Navigate to Settings page
   - Configure organization name
   - Set week start day
   - Adjust default capacity

3. **Import Historical Data** (if applicable)
   - Navigate to Associates → Import Opening Balance
   - Download CSV template
   - Fill in your historical projects
   - Upload and verify

4. **Train Your Team**
   - Show them how to create projects
   - Demonstrate the recommendation engine
   - Explain the assignment workflow
   - Review reports together

5. **Plan for Production**
   - Review security settings
   - Set up backups in Supabase
   - Configure production environment
   - Plan deployment strategy

---

## Production Deployment

When ready for production:

### 1. Create Production Supabase Project

- Separate project from development
- Stronger database password
- Enable Point-in-Time Recovery
- Set up monitoring

### 2. Update Environment Variables

```env
VITE_SUPABASE_URL=https://production-project.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key
```

### 3. Build for Production

```bash
npm run build
```

### 4. Deploy

Choose a platform:
- **Vercel**: [vercel.com](https://vercel.com)
- **Netlify**: [netlify.com](https://netlify.com)
- **Self-hosted**: nginx/Apache/Caddy

### 5. Configure Domain

- Add custom domain
- Enable HTTPS (automatic on Vercel/Netlify)
- Update Supabase allowed redirect URLs

---

## Getting Help

If you're stuck:

1. **Check Documentation**
   - Review README.md
   - Read ARCHITECTURE.md
   - Check DATABASE_SCHEMA.md

2. **Common Issues**
   - Review Troubleshooting section above
   - Check browser console for errors
   - Check Supabase logs

3. **Community Support**
   - GitHub Issues
   - Supabase Discord
   - Stack Overflow

4. **Professional Support**
   - Email: support@wbipas.com
   - Paid support plans available

---

## Summary

You should now have:

✅ WBIPAS running locally
✅ Supabase database configured
✅ First user created and logged in
✅ Sample data for testing
✅ All features verified

**Congratulations! You're ready to use WBIPAS!** 🎉

---

## What's Next?

- Explore all features
- Customize for your organization
- Train your team
- Plan production deployment
- Provide feedback for improvements

Welcome to efficient workload management! 🚀
