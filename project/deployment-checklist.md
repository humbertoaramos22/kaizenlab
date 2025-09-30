# Deployment Checklist

## Before Deploying

- [ ] Have Supabase URL and Anon Key ready
- [ ] Project builds successfully (`npm run build`)
- [ ] All environment variables configured

## Files to Include in Deployment

### Essential Files:
- `package.json` - Dependencies and scripts
- `index.html` - Main HTML file
- `src/` folder - All source code
- `public/` folder - Static assets
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration
- `tsconfig.json` - TypeScript configuration

### Optional Files:
- `README.md` - Documentation
- `.env.example` - Environment variable template

### Files to EXCLUDE:
- `.env` - Contains secrets (never upload this)
- `node_modules/` - Dependencies (will be installed automatically)
- `dist/` - Build output (generated during deployment)

## Deployment Steps

1. Upload project to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

Your app will be live at: `https://your-app-name.vercel.app`