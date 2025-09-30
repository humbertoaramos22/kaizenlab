# Deploy Your URL Masking App to Netlify (Free)

## Step 1: Download Your Project from Bolt

1. **In Bolt interface**: Look for "Download ZIP" or "Export" button
2. **Download the complete project** as a ZIP file
3. **Extract the ZIP** to a folder on your computer

## Step 2: Prepare Your Environment Variables

1. **Copy your `.env` file** from Bolt (it contains your Supabase credentials)
2. **Note down these values** (you'll need them for Netlify):
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Step 3: Create Netlify Account & Deploy

### Option A: Drag & Drop Deploy (Easiest)

1. **Go to**: https://netlify.com
2. **Sign up** for free account
3. **Go to**: https://app.netlify.com
4. **Drag your project folder** directly onto the Netlify dashboard
5. **Wait for build** to complete

### Option B: Git Deploy (Recommended for updates)

1. **Create GitHub account** if you don't have one
2. **Upload your project** to a new GitHub repository
3. **In Netlify**: Click "New site from Git"
4. **Connect GitHub** and select your repository
5. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

## Step 4: Configure Environment Variables

1. **In Netlify dashboard**: Go to Site Settings → Environment Variables
2. **Add these variables**:
   ```
   VITE_SUPABASE_URL = your-supabase-url-here
   VITE_SUPABASE_ANON_KEY = your-supabase-anon-key-here
   ```
3. **Click "Save"**

## Step 5: Redeploy with Environment Variables

1. **Go to**: Deploys tab
2. **Click**: "Trigger deploy" → "Deploy site"
3. **Wait** for build to complete (2-3 minutes)

## Step 6: Test Your Site

1. **Click the generated URL** (something like `https://amazing-app-123456.netlify.app`)
2. **Test login** with your existing credentials
3. **Verify all functionality** works

## Step 7: Custom Domain (Optional)

1. **In Netlify**: Go to Domain Settings
2. **Add custom domain**: yourdomain.com
3. **Follow DNS instructions** from your domain provider
4. **SSL certificate** will be automatically generated

## Step 8: Update Supabase Settings (If Needed)

1. **Go to Supabase dashboard**
2. **Authentication → URL Configuration**
3. **Add your new Netlify URL** to allowed origins:
   ```
   https://your-site-name.netlify.app
   https://yourdomain.com (if using custom domain)
   ```

## Troubleshooting

### Build Fails?
- Check that `package.json` has correct build script
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

## Benefits of Netlify

✅ **Free hosting** (no monthly costs)
✅ **Automatic SSL** certificates
✅ **Global CDN** for fast loading
✅ **Automatic deployments** from Git
✅ **Custom domains** supported
✅ **Form handling** built-in
✅ **Serverless functions** available

## Your New Setup Cost

- **Netlify**: $0/month (free tier)
- **Supabase**: $0/month (free tier)
- **Total**: $0/month 🎉

## Next Steps After Deployment

1. **Test thoroughly** on the live site
2. **Update any hardcoded URLs** if needed
3. **Share the new URL** with your users
4. **Set up custom domain** if desired
5. **Monitor usage** in both Netlify and Supabase dashboards

Your URL masking application will work exactly the same, but now it's hosted for free!