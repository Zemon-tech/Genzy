# Deployment Guide: Cloudflare Pages (Frontend) & Fly.io (Backend)

This guide provides instructions for deploying the Genzy application with:
- Frontend on Cloudflare Pages
- Backend on Fly.io

## Part 1: Deploying Frontend to Cloudflare Pages

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
   - Select the repository containing your Genzy project

4. **Configure build settings**
   - **Project name**: `genzy` (or your preferred name)
   - **Production branch**: `main` (or your default branch)
   - **Framework preset**: Select "Vite"
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend` (since your frontend is in a subfolder)

5. **Environment variables**
   - Add any required environment variables from your frontend `.env` file
   - Particularly important: set your backend API URL to point to your Fly.io deployment
   - For example: `VITE_API_URL=https://genzy-backend.fly.dev`

6. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will build and deploy your frontend application

7. **Custom domain (optional)**
   - In your Pages project, go to the "Custom domains" tab
   - Click "Set up a custom domain"
   - Follow the instructions to set up your domain

## Part 2: Deploying Backend to Fly.io

### Prerequisites
- Install Fly CLI: `npm install -g @fly/fly`
- A Fly.io account

### Steps

1. **Install the Fly CLI if you haven't already**
   ```bash
   npm install -g @fly/fly
   ```

2. **Log in to Fly.io**
   ```bash
   fly auth login
   ```
   This will open your browser for authentication.

3. **Create a fly.toml configuration file in your backend directory**
   Create a file `backend/fly.toml` with the following content:
   ```toml
   app = "genzy-backend"
   primary_region = "fra"  # Choose your preferred region

   [build]
     dockerfile = "Dockerfile"

   [env]
     PORT = "8080"

   [http_service]
     internal_port = 8080
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
   ```

4. **Check your Dockerfile**
   You already have a Dockerfile in your backend directory. Make sure it:
   - Uses a Node.js base image
   - Copies your package.json and installs dependencies
   - Copies your application code
   - Specifies the correct start command
   - Exposes the right port (8080)

   If it needs modifications, update accordingly.

5. **Update CORS settings in your backend**
   Make sure your Express backend allows requests from your Cloudflare Pages domain:
   ```javascript
   app.use(cors({
     origin: ['https://your-cloudflare-pages-domain.pages.dev', 'http://localhost:5173'],
     credentials: true
   }));
   ```

6. **Deploy to Fly.io**
   ```bash
   cd backend
   fly launch --name genzy-backend
   ```
   Follow the prompts. When asked if you want to use an existing `fly.toml` file, select yes.

7. **Set environment variables**
   ```bash
   fly secrets set SUPABASE_URL=your_supabase_url
   fly secrets set SUPABASE_SERVICE_KEY=your_supabase_key
   # Add any other secrets your application needs
   ```

8. **Deploy your application**
   ```bash
   fly deploy
   ```

9. **Verify your deployment**
   ```bash
   fly status
   ```
   
   You can also open your application in the browser:
   ```bash
   fly open
   ```

## Part 3: Connecting Frontend and Backend

1. **Update API URL in your frontend environment**
   Update the API URL in your frontend environment variables on Cloudflare Pages to point to your Fly.io backend:
   - Go to your Pages project in the Cloudflare dashboard
   - Navigate to "Settings" > "Environment variables"
   - Add or update the API URL variable: `VITE_API_URL=https://genzy-backend.fly.dev`

2. **Redeploy your frontend**
   - Trigger a new deployment from the Cloudflare Pages dashboard
   - Or push new changes to your repository to trigger automatic deployment

## Part 4: Testing and Monitoring

1. **Test the full application**
   - Visit your Cloudflare Pages URL
   - Test all functionality, especially authentication and API calls
   - Check browser dev tools for any errors or CORS issues

2. **Monitoring**
   - **Cloudflare**: Use Cloudflare Analytics for frontend monitoring
   - **Fly.io**: Use `fly logs` to monitor backend logs
   - **Supabase**: Check the Supabase dashboard for database activity

## Part 5: Troubleshooting

1. **CORS issues**
   - Ensure your backend CORS settings include your Cloudflare Pages domain
   - Use the Network tab in browser dev tools to identify CORS problems

2. **Environment variables**
   - Double-check that all required environment variables are set on both platforms
   - Verify that variables are being accessed correctly in your code

3. **API connectivity**
   - Test API endpoints directly using tools like Postman or curl
   - Check that your frontend is using the correct API URLs

---

For more information, visit:
- [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/)
- [Fly.io documentation](https://fly.io/docs/) 