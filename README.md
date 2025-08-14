# HavenDrip (aka Genzy)

**Empowering Innovation, Elevating Experiences Daily**

A modern full-stack e-commerce platform built with React, Node.js, and Supabase.

🌐 **Live Demo**: [https://haven-shop.pages.dev](https://haven-shop.pages.dev)

## 🚀 Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS + Framer Motion
- PWA Support with Service Workers
- React Hook Form + Zod Validation
- Axios for API calls

**Backend:**
- Node.js + Express
- JWT Authentication with Refresh Tokens
- Supabase (PostgreSQL) Database
- Multer for File Uploads
- CORS enabled

**Deployment:**
- Railway (Backend)
- Cloudflare Pages (Frontend)
- Docker Support
- Nixpacks Builder

## ✨ Features

- 🛍️ **Multi-role E-commerce**: Users, Sellers, and Admin dashboards
- 🔐 **Secure Authentication**: JWT-based auth with refresh tokens
- 📱 **PWA Ready**: Offline support and mobile-first design
- 🎨 **Modern UI**: Responsive design with Tailwind CSS
- 🖼️ **Image Management**: Product images and size chart uploads
- 🛒 **Shopping Features**: Cart, wishlist, orders, and checkout
- 📊 **Admin Panel**: User, seller, and product management
- 🏪 **Seller Dashboard**: Product management and order tracking

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Supabase account (for database)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Zemon-tech/Genzy
cd Genzy
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your Supabase credentials
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# JWT_SECRET=your_jwt_secret
# JWT_REFRESH_SECRET=your_refresh_secret

# Start development server
npm run dev
```

The backend will run on `http://localhost:5011`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
yarn install

# Create environment file
cp .env.example .env

# Update .env with your configuration
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
# VITE_BACKEND_URL=http://localhost:5011

# Start development server
yarn dev
```

The frontend will run on `http://localhost:5173`

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

```bash
# Create environment files first (see above)
# Then run with docker-compose
docker-compose up --build
```

This will start:
- Frontend on `http://localhost:80`
- Backend on `http://localhost:5000`

### Individual Docker Builds

```bash
# Build backend
cd backend
docker build -t havendrip-backend .

# Build frontend
cd frontend
docker build -t havendrip-frontend .
```

## 🚀 Deployment

### Railway (Backend)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy using the included `railway.toml` configuration

### Cloudflare Pages (Frontend)

1. Connect repository to Cloudflare Pages
2. Set build command: `cd frontend && yarn install && yarn build`
3. Set build output directory: `frontend/dist`
4. Configure environment variables

## 📁 Project Structure

```
├── backend/                 # Node.js Express API
│   ├── routes/             # API routes
│   │   ├── user/          # User authentication routes
│   │   ├── seller/        # Seller routes
│   │   └── admin/         # Admin routes
│   ├── middleware/        # Auth middleware
│   ├── server.js          # Main server file
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json
├── docker-compose.yml      # Docker composition
├── railway.toml           # Railway deployment config
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
PORT=5011
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:5011
VITE_API_BASE_URL=/api
```

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
yarn test
```

### Building for Production
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
yarn build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://haven-shop.pages.dev](https://haven-shop.pages.dev)
- **Repository**: [https://github.com/Zemon-tech/Genzy](https://github.com/Zemon-tech/Genzy)

---

Built with ❤️ by the HavenDrip team
