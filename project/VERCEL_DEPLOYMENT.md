# Deploy Your URL Masking App to Vercel (Free)

## Step 1: Download Your Project from Bolt

1. **In Bolt interface**: Look for "Download ZIP" or "Export" button
2. **Download the complete project** as a ZIP file
3. **Extract the ZIP** to a folder on your computer

## Step 2: Create GitHub Account (If You Don't Have One)

1. **Go to**: https://github.com
2. **Sign up** for free account
3. **Verify your email**

## Step 3: Upload Project to GitHub

### Option A: Using GitHub Web Interface (Easiest)
1. **Go to**: https://github.com/new
2. **Repository name**: `url-masking-app` (or any name you like)
3. **Make it Public** (required for free Vercel)
4. **Click "Create repository"**
5. **Click "uploading an existing file"**
6. **Drag all your project files** (not the ZIP, the extracted files)
7. **Commit changes**

### Option B: Using GitHub Desktop (Alternative)
1. **Download GitHub Desktop**: https://desktop.github.com
2. **Clone your new repository**
3. **Copy your project files** into the folder
4. **Commit and push**

## Step 4: Deploy to Vercel

1. **Go to**: https://vercel.com
2. **Sign up with GitHub** (easiest option)
3. **Click "New Project"**
4. **Select your repository** (`url-masking-app`)
5. **Click "Deploy"**

## Step 5: Add Environment Variables

1. **In Vercel dashboard**: Go to your project
2. **Click "Settings" tab**
3. **Click "Environment Variables"**
4. **Add these variables**:
   ```
   VITE_SUPABASE_URL = your-supabase-url-here
   VITE_SUPABASE_ANON_KEY = your-supabase-anon-key-here
   ```
5. **Click "Save"**

## Step 6: Redeploy with Environment Variables

1. **Go to "Deployments" tab**
2. **Click the three dots** on latest deployment
3. **Click "Redeploy"**
4. **Wait for build** to complete (2-3 minutes)

## Step 7: Test Your Site

1. **Click the generated URL** (something like `https://url-masking-app-username.vercel.app`)
2. **Test login** with your existing credentials
3. **Verify all functionality** works

## Step 8: Custom Domain (Optional)

1. **In Vercel**: Go to Settings → Domains
2. **Add your custom domain**: yourdomain.com
3. **Follow DNS instructions** from your domain provider
4. **SSL certificate** will be automatically generated

## Step 9: Update Supabase Settings (If Needed)

1. **Go to Supabase dashboard**
2. **Authentication → URL Configuration**
3. **Add your new Vercel URL** to allowed origins:
   ```
   https://your-app-name.vercel.app
   https://yourdomain.com (if using custom domain)
   ```

## Troubleshooting

### Build Fails?
- Check that `package.json` has correct build script: `"build": "vite build"`
- Ensure all dependencies are listed
- Check build logs for specific errors

### Environment Variables Not Working?
- Make sure they start with `VITE_`
- Redeploy after adding variables
- Check spelling matches exactly

### Authentication Issues?
- Update Supabase allowed origins
- Check environment variables are set correctly
- Verify Supabase project is active

## Benefits of Vercel

✅ **Free hosting** (generous limits)
✅ **Automatic SSL** certificates
✅ **Global CDN** for fast loading
✅ **Automatic deployments** from Git
✅ **Custom domains** supported
✅ **Built for React/Next.js**
✅ **Excellent performance**

## Your New Setup Cost

- **Vercel**: $0/month (free tier)
- **Supabase**: $0/month (free tier)
- **GitHub**: $0/month (free tier)
- **Total**: $0/month 🎉

## Next Steps After Deployment

1. **Test thoroughly** on the live site
2. **Update any hardcoded URLs** if needed
3. **Share the new URL** with your users
4. **Set up custom domain** if desired
5. **Monitor usage** in Vercel dashboard

Your URL masking application will work exactly the same, but now it's hosted on Vercel's fast global network!

## Quick Commands (If You Use Terminal)

If you're comfortable with command line:

```bash
# Install Vercel CLI
npm i -g vercel

# In your project folder
vercel

# Follow the prompts
```

But the web interface method above is much easier for beginners!