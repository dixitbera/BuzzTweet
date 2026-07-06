# 🐝 BuzzTweet

A full-stack social media platform built with React, Express, MongoDB, and Socket.io. Share ideas, spark conversations, and connect with a global community.

## ✨ Features

- **Posts** — Create, edit, delete posts with image uploads
- **AI Post Generation** — Generate engaging posts with built-in AI assistant
- **Rich Text Editor** — Tiptap-powered editor with character count
- **Real-time Chat** — Socket.io powered messaging with typing indicators, seen receipts, and online status
- **Comments & Likes** — Engage with posts through comments and likes (with nested comment likes)
- **User Profiles** — Customizable profiles with bio, avatar, follower/following counts
- **Follow System** — Follow/unfollow users
- **Infinite Scroll** — Cursor-based pagination for feeds
- **Authentication** — JWT-based auth with httpOnly cookies

## 🛠️ Tech Stack

| Layer      | Technology                             |
|------------|----------------------------------------|
| Frontend   | React 19, Vite, TailwindCSS, Axios     |
| Backend    | Express 5, Mongoose, Socket.io         |
| Database   | MongoDB (Atlas for production)         |
| AI         | OpenRouter API (Llama 3.1)             |
| Deployment | Vercel (frontend) + Render (backend)   |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- (Optional) [OpenRouter API key](https://openrouter.ai/) for AI post generation

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/BuzzTweet.git
   cd BuzzTweet
   ```

2. **Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your values (MongoDB URI, JWT secret, etc.)
   npm install
   npm run dev    # development (with nodemon)
   npm start      # production
   ```

3. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your backend URL
   npm install
   npm run dev    # development
   npm run build  # production build
   ```

4. **Open** [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Deployment

### Backend → Render

1. Push your code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add environment variables:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = a strong random string (`openssl rand -hex 32`)
   - `FRONTEND_URL` = your Vercel URL (e.g. `https://buzztweet.vercel.app`)
   - `OPENROUTER_API_KEY` = your OpenRouter key (optional)

### Frontend → Vercel

1. Create a new project on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to `Vite`
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://buzztweet-backend.onrender.com`)
5. Deploy!

## 📁 Project Structure

```
BuzzTweet/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── socket/          # Socket.io handlers
│   │   ├── validtion/       # Validation helpers
│   │   └── index.js         # Entry point
│   ├── uploads/             # User-uploaded images
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── utils/           # Helpers (AI service, validators)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── render.yaml
└── README.md
```

## 📄 License

This project is for educational purposes.
