# URL Masking Application

A secure domain access management system built with React, TypeScript, and Supabase.

## Features

- User authentication and management
- Domain masking and access control
- Admin dashboard for user and domain management
- Session monitoring and security
- Role-based access control

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This project is ready to deploy to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

The build output will be in the `dist` folder.