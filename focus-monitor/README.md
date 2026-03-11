# FocusGuard — Focus Monitoring System

A full-stack web application that monitors user focus and triggers alerts when users leave the application window.

---

## Project Structure

```
focus-monitor/
├── client/          # React + Vite frontend
└── server/          # Node.js + Express backend
```

---

## Quick Start

### 1. Setup the Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 2. Setup the Frontend

```bash
cd client
npm install
cp .env.example .env
# Edit .env if your backend is not on localhost:5000
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Environment Variables

### Server (`server/.env`)

| Variable     | Description                        | Default                        |
|--------------|------------------------------------|-------------------------------|
| `PORT`       | Server port                        | `5000`                        |
| `MONGO_URI`  | MongoDB connection string          | `mongodb://localhost:27017/...` |
| `JWT_SECRET` | Secret key for JWT signing         | (set a strong random string)  |
| `CLIENT_URL` | Frontend origin for CORS           | `http://localhost:5173`       |

### Client (`client/.env`)

| Variable        | Description           | Default                      |
|-----------------|-----------------------|------------------------------|
| `VITE_API_URL`  | Backend API base URL  | `/api` (proxied via Vite)    |

---

## Features

### User Features
- Register and login
- Focus monitoring starts automatically after login
- Detects tab switching (`visibilitychange` event)
- Detects browser/window blur (`blur` event)
- 30-second buzzer alarm using Web Audio API when focus is lost
- Dismiss alarm button
- Live violation counter
- Personal violation log

### Admin Features
- Admin login
- Stats dashboard (total violations, last 24h, top violators, breakdown by reason)
- Full violations table with user filter
- User management table with violation counts

---

## API Endpoints

### Auth
| Method | Endpoint             | Auth     | Description              |
|--------|----------------------|----------|--------------------------|
| POST   | `/api/auth/register` | None     | Register new user        |
| POST   | `/api/auth/login`    | None     | Login and get JWT        |
| GET    | `/api/auth/users`    | Admin    | List all users           |

### Violations
| Method | Endpoint              | Auth     | Description                   |
|--------|-----------------------|----------|-------------------------------|
| POST   | `/api/violation`      | User     | Record a focus violation      |
| GET    | `/api/violations`     | Admin    | Get all violations (paginated)|
| GET    | `/api/my-violations`  | User     | Get current user's violations |
| GET    | `/api/stats`          | Admin    | Get violation statistics      |

---

## Focus Detection Logic

The system listens for two browser events:

1. **`document.visibilitychange`** — fires when the user switches tabs or the document becomes hidden
2. **`window.blur`** — fires when the browser window loses focus (minimized, other app, etc.)

When either event triggers:
1. A Web Audio API oscillator generates a pulsing alarm sound
2. A 30-second countdown begins
3. A violation is sent to the backend API
4. The violation is stored in MongoDB with userId, username, reason, and timestamp

---

## Deployment

### Frontend → Vercel
1. Push `client/` to GitHub
2. Import in Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add env variable: `VITE_API_URL=https://your-backend.onrender.com/api`

### Backend → Render
1. Push `server/` to GitHub
2. Create a new Web Service on Render
3. Set start command: `node server.js`
4. Add all environment variables from `.env.example`

### Database → MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Add a database user
3. Whitelist all IPs (`0.0.0.0/0`) for Render compatibility
4. Copy the connection string to `MONGO_URI`

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Tailwind CSS
- **Backend**: Node.js, Express.js, JWT, bcryptjs
- **Database**: MongoDB Atlas, Mongoose
- **Audio**: Web Audio API (no file dependencies)
- **Deployment**: Vercel (frontend), Render (backend), MongoDB Atlas (database)

---

## Default Test Accounts

After registering, you can create accounts with any credentials. To create an admin account, set `role: "admin"` during registration (or use the register form's role dropdown).
