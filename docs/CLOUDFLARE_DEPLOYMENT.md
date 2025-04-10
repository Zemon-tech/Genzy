# Deploying Haven to Cloudflare

This guide provides step-by-step instructions for deploying the Haven application to Cloudflare. The application consists of a React frontend and a Node.js backend.

## 1. Deploying the Frontend to Cloudflare Pages

### Prerequisites
- A Cloudflare account
- Git repository with your project

### Steps

1. **Build your frontend locally first**
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   This will create a `dist` directory with your built application.

2. **Log in to your Cloudflare dashboard**
   - Go to https://dash.cloudflare.com/
   - Sign in or create an account if you don't have one

3. **Set up a new Pages project**
   - In the Cloudflare dashboard, click on "Pages" in the sidebar
   - Click "Create a project" > "Connect to Git"
   - Connect to your GitHub/GitLab repository containing your project
   - Select the repository containing your Haven project

4. **Configure build settings**
   - **Project name**: `haven` (or your preferred name)
   - **Production branch**: `main` (or your default branch)
   - **Framework preset**: Select "Vite"
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend` (since your frontend is in a subfolder)

5. **Environment variables**
   - Add any required environment variables from your frontend `.env` file
   - Ensure any API URLs point to your deployed backend (see section 2)

6. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will build and deploy your frontend application

7. **Custom domain (optional)**
   - In your Pages project, go to the "Custom domains" tab
   - Click "Set up a custom domain"
   - Follow the instructions to set up your domain

## 2. Deploying the Backend to Cloudflare Workers

### Prerequisites
- Cloudflare account
- Wrangler CLI installed

### Steps

1. **Install Wrangler CLI globally**
   ```bash
   npm install -g wrangler
   ```

2. **Log in to Cloudflare using Wrangler**
   ```bash
   wrangler login
   ```
   This will open a browser window to authenticate with Cloudflare.

3. **Prepare your backend for Cloudflare Workers**
   - The `worker.js` and `wrangler.toml` files have been created for you
   - You'll need to migrate your Express routes to the worker.js format
   - The example in worker.js shows how to handle basic routing

4. **Set up environment variables**
   - Use Wrangler to set secret environment variables:
   ```bash
   cd backend
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_KEY
   # Add any other secrets your application needs
   ```

5. **Deploy the Worker**
   ```bash
   cd backend
   npm install
   npm run deploy
   ```

6. **Configure your Worker**
   - In the Cloudflare dashboard, go to "Workers & Pages"
   - Find your deployed worker
   - Go to "Settings" > "Variables" to check your environment variables
   - Go to "Triggers" > "Custom Domains" to set up a custom domain (optional)

## 3. Connecting Frontend and Backend

1. **Update API endpoints in your frontend**
   - In your frontend code, update all API endpoint URLs to point to your Cloudflare Worker URL
   - Example: `https://haven-backend.your-username.workers.dev`

2. **Redeploy your frontend**
   - After updating your API endpoints, redeploy your frontend to Cloudflare Pages

## 4. Database Configuration

Since you're using Supabase, ensure:

1. **Supabase Security Rules**
   - Set appropriate RLS (Row Level Security) policies
   - Configure CORS settings to allow requests from your Cloudflare Pages domain

2. **API Authentication**
   - Ensure your authentication flows work with the deployed application

## 5. Monitoring and Troubleshooting

1. **Cloudflare Analytics**
   - Use Cloudflare Analytics to monitor your application performance
   - Check for any errors in the Workers logs

2. **Common Issues**
   - CORS issues: Ensure your CORS headers are correctly set
   - Environment variables: Verify all required variables are properly set
   - Authentication flows: Test authentication in the deployed environment

## 6. Optimizations

1. **Caching**
   - Configure Cloudflare caching rules for improved performance
   - Use Cache-Control headers for static assets

2. **Workers KV**
   - Consider using Cloudflare KV for caching frequently accessed data

3. **Edge Functions**
   - For complex backend operations, consider using Cloudflare Durable Objects

## 7. CI/CD (Optional)

Set up continuous deployment using GitHub Actions to automatically deploy:

1. **Create GitHub Actions workflow files**
   - `.github/workflows/deploy-frontend.yml`
   - `.github/workflows/deploy-backend.yml`

2. **Configure the workflows**
   - Use Cloudflare's GitHub Actions for automatic deployments

---

For more information, visit:
- [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/) 