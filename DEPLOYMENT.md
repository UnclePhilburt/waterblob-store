# Deploying Water Blob Store to Render

## Quick Deploy Steps

### 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `waterblob-store` repository

### 3. Configure the Web Service

**Basic Settings:**
- **Name:** `waterblob-store` (or whatever you prefer)
- **Environment:** `Node`
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** Leave blank (uses repo root)

**Build & Deploy:**
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`

### 4. Environment Variables

Click **"Advanced"** and add these environment variables:

**Required:**
- `NODE_ENV` = `production`
- `PORT` = `3000` (Render will override this automatically)

**Optional (for full functionality):**
- `FRONTEND_URL` = `https://your-app-name.onrender.com`
- `DATABASE_URL` = Your PostgreSQL connection string (if using database)
- `STRIPE_SECRET_KEY` = Your Stripe secret key (for checkout)
- `STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` = Your Stripe webhook secret

### 5. Deploy!

Click **"Create Web Service"**

Render will:
- Clone your repo
- Run the build command
- Start your server
- Give you a URL like: `https://waterblob-store.onrender.com`

---

## Alternative: Using render.yaml (Blueprint)

If you have a `render.yaml` file in your repo, you can:

1. Go to Render Dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your repo
4. Render will auto-configure everything from `render.yaml`

---

## Post-Deployment

### Test Your Site
Visit your Render URL to see:
- ✅ Homepage with 3D rotating Water Blob
- ✅ About page
- ✅ Modern theme switcher

### Check API Health
Visit: `https://your-app.onrender.com/api`

Should return:
```json
{
  "message": "Water Blob Store API is running!",
  "database": "not configured",
  "stripe": "not configured"
}
```

---

## Optional: Add PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Name it: `waterblob-db`
3. Choose your plan (Free tier available)
4. Once created, copy the **Internal Database URL**
5. Add it to your Web Service environment variables as `DATABASE_URL`
6. Restart your web service

### Run Database Migrations

You'll need to create the database schema. SSH into your Render service or use a database client to run:

```sql
-- Coming soon: migration files
```

---

## Troubleshooting

**3D Model Not Loading:**
- Check browser console for errors
- Ensure `assets/blob.glb` is committed to git
- Verify file path is correct in production

**API Errors:**
- Check Render logs: Dashboard → Your Service → Logs
- Verify environment variables are set
- Check if DATABASE_URL is needed but missing

**Slow First Load:**
- Free tier services sleep after inactivity
- First request may take 30-60 seconds to wake up
- Consider upgrading to paid tier for always-on service

---

## Free Tier Limits

Render free tier includes:
- ✅ 750 hours/month (always-on if only service)
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Slower build times

---

## Need Help?

- Render Docs: https://render.com/docs
- Your app URL: Check Render Dashboard after deploy
