# Deployment Guide for Genzy

This guide will walk you through deploying your Genzy application with Cloudflare Pages (frontend) and Railway (backend).

## Prerequisites

- A Cloudflare account (free tier is sufficient)
- A Railway account
- Git repository with your codebase
- Node.js and npm/yarn installed locally for testing

## Part 1: Deploying the Backend to Railway

Railway is a platform that makes it easy to deploy Node.js applications. Follow these steps to deploy your backend:

### 1. Sign up for Railway

If you don't have an account, sign up at [railway.app](https://railway.app/).

### 2. Install the Railway CLI (Optional)

```bash
npm i -g @railway/cli
railway login
```

### 3. Create a New Project on Railway

1. Login to your Railway dashboard
2. Click "New Project" and select "Deploy from GitHub repo"
3. Connect your GitHub account and select your repository
4. Choose the "backend" directory as your source directory

### 4. Configure Environment Variables

In your Railway dashboard, navigate to your project's "Variables" tab and add the following environment variables:

```
SUPABASE_URL=https://ceirzujirokwhiruvdlk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaXJ6dWppcm9rd2hpcnV2ZGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NzAxODgsImV4cCI6MjA1NzI0NjE4OH0.GdTvC1p76j83f__lbwFeVnNifAfPBtJ1uRIdKpJ7rjI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaXJ6dWppcm9rd2hpcnV2ZGxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTY3MDE4OCwiZXhwIjoyMDU3MjQ2MTg4fQ._VtdrSttyAFg_4Z6IVtfjABAlJwDCFbp-gFWEOY3cRA
JWT_SECRET=a67d437c8b1c4a3e9f0d2e1b5a8c7f4d9e2b5a8c7f4d3b6a9c2e5f8d1b4a7c0
JWT_REFRESH_SECRET=f9e8d7c6b5a4932187654321098765432112345678901234567890123456789012
NODE_ENV=production
```

**IMPORTANT**: After deploying the frontend, update the `FRONTEND_URL` variable with your Cloudflare Pages URL.

### 5. Deploy the Backend

Railway will automatically deploy your application when you push to the connected repository. You can also trigger a manual deployment from the dashboard.

### 6. Get Your Backend URL

Once deployed, Railway will assign a URL to your application. Copy this URL as you'll need it for the frontend deployment.

## Part 2: Deploying the Frontend to Cloudflare Pages

Cloudflare Pages is a JAMstack platform for frontend developers to collaborate and deploy websites.

### 1. Sign up for Cloudflare

If you don't have an account, sign up at [cloudflare.com](https://www.cloudflare.com/).

### 2. Update Environment Variables

Before deploying, update the `.env.production` file in your frontend directory:

```
VITE_BACKEND_URL=https://your-railway-app-url.railway.app
```

Replace `https://your-railway-app-url.railway.app` with the actual URL of your Railway backend.

### 3. Connect Your Repository to Cloudflare Pages

1. Log in to your Cloudflare dashboard
2. Navigate to the "Pages" section
3. Click "Create a project"
4. Connect your GitHub account and select your repository
5. Configure your build settings:
   - **Project name**: Choose a name for your project (e.g., "genzy-frontend")
   - **Production branch**: `main` (or your default branch)
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/` (repository root)

### 4. Configure Environment Variables in Cloudflare

Add the following environment variables in the "Environment variables" section:

```
VITE_SUPABASE_URL=https://ceirzujirokwhiruvdlk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaXJ6dWppcm9rd2hpcnV2ZGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NzAxODgsImV4cCI6MjA1NzI0NjE4OH0.GdTvC1p76j83f__lbwFeVnNifAfPBtJ1uRIdKpJ7rjI
VITE_BACKEND_URL=https://your-railway-app-url.railway.app
```

Replace `https://your-railway-app-url.railway.app` with your actual Railway backend URL.

### 5. Deploy Your Frontend

Click "Save and Deploy" to start the deployment process. Cloudflare will build and deploy your frontend application.

### 6. Configure the Backend with Your Frontend URL

Once your frontend is deployed, go back to your Railway dashboard and update the `FRONTEND_URL` environment variable with your Cloudflare Pages URL (e.g., `https://genzy-frontend.pages.dev`).

## Part 3: Connecting the Frontend to Backend

After successfully deploying both your frontend and backend, you need to properly connect them:

### Step 1: Update Your Railway Backend Environment

1. Go to your Railway dashboard
2. Navigate to your backend project
3. Go to the "Variables" tab
4. Update the `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-cloudflare-pages-url.pages.dev
   ```
   Replace with your actual Cloudflare Pages URL

### Step 2: Update Your Cloudflare Pages Environment

1. Go to your Cloudflare dashboard
2. Navigate to the "Pages" section
3. Select your project
4. Go to "Settings" > "Environment variables"
5. Update the `VITE_BACKEND_URL` variable:
   ```
   VITE_BACKEND_URL=https://your-railway-app-url.railway.app
   ```
   Replace with your actual Railway backend URL

### Step 3: Trigger Redeployments

1. For Railway: The application should restart automatically after updating environment variables
2. For Cloudflare Pages: Trigger a new build from the "Deployments" tab

### Step 4: Test the Connection

1. Visit your Cloudflare Pages URL
2. Try to perform an action that requires backend interaction (like logging in)
3. Check the browser's developer console for API call logs
4. Verify that requests are being made to your Railway backend URL and returning successful responses

## Troubleshooting

### CORS Issues

If you encounter CORS errors, verify that:

1. The `FRONTEND_URL` in your backend environment variables matches your Cloudflare Pages URL
2. The `VITE_BACKEND_URL` in your frontend environment variables matches your Railway app URL
3. Your backend CORS configuration is correctly set up to allow requests from your frontend domain

### Authentication Issues

If authentication doesn't work:

1. Check that cookies are being properly set and sent
2. Verify that the JWT secrets are correctly configured
3. Ensure that your frontend is making requests to the correct backend endpoints

## Continuous Deployment

Both Cloudflare Pages and Railway support continuous deployment:

- **Cloudflare Pages**: Automatically rebuilds when you push to your repository
- **Railway**: Automatically redeploys when changes are pushed to your connected repository

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Railway Documentation](https://docs.railway.app/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html) 