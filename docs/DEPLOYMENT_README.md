# Genzy Deployment Guide

This is a quick-start guide for deploying Genzy with:
- Frontend on Cloudflare Pages
- Backend on Fly.io

## Quick Start Checklist

### 1. Prerequisites
- [ ] Cloudflare account
- [ ] Fly.io account
- [ ] Fly CLI installed: `npm install -g @flyctl/fly`
- [ ] Git repository with your code

### 2. Deploy Backend to Fly.io
```bash
# Login to Fly.io
fly auth login

# Navigate to backend directory
cd backend

# Launch the app (first time only)
fly launch --name genzy-backend

# Set your environment variables
fly secrets set SUPABASE_URL=your_supabase_url
fly secrets set SUPABASE_SERVICE_KEY=your_supabase_key
# Add any other secrets needed

# Deploy your application
fly deploy

# Check the status
fly status
```

### 3. Deploy Frontend to Cloudflare Pages
1. Connect your GitHub/GitLab repository to Cloudflare Pages
2. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
3. Set environment variables:
   - Use `cloudflare.env.example` as a reference
   - Make sure to set `VITE_BACKEND_URL=https://genzy-backend.fly.dev`
4. Deploy

### 4. Important Files
- `backend/fly.toml`: Configuration for Fly.io
- `backend/Dockerfile`: Container configuration
- `frontend/public/_redirects`: Required for SPA routing on Cloudflare
- `frontend/cloudflare.env.example`: Example environment variables for Cloudflare

### 5. Post-Deployment
- [ ] Test authentication flow
- [ ] Verify API calls are working
- [ ] Check CORS settings if you encounter issues

## Detailed Instructions

For detailed step-by-step instructions, see `DEPLOYMENT_GUIDE.md`

## Troubleshooting

- **CORS Issues**: Ensure your backend allows your Cloudflare domain
- **Environment Variables**: Check they're correctly set in both platforms
- **Build Failures**: Verify your build commands and dependencies 