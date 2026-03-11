# FocusGuard — Focus Monitoring System

A full-stack web application that monitors user focus during a session. It detects when users leave the tab, tracks how long they were away, triggers alarms for prolonged inactivity, and logs all activity to MongoDB.

---

## Project Structure

```
focus-monitor/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── components/        # Navbar, ViolationTable
│       ├── pages/             # Dashboard, AdminDashboard, Login, Register
│       └── utils/             # api.js, AuthContext, useFocusMonitor
└── server/                    # Node.js + Express backend
    ├── controllers/           # authController, violationController, awayTimeController
    ├── middleware/             # auth (JWT verification)
    ├── models/                # User, Violation, AwayLog
    └── routes/                # authRoutes, violationRoutes, awayTimeRoutes
```

---

## Prerequisites

- **Node.js** v16+ and **npm**
- **MongoDB Atlas** account (free tier works) or local MongoDB
- **Git**

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/focus-session-monitoring.git
cd focus-session-monitoring/focus-monitor
```

### 2. Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/focus-monitor?retryWrites=true&w=majority
JWT_SECRET=your_strong_random_secret_key_here
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev
```

### 3. Setup the Frontend

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory (optional — defaults to `/api`):

```env
VITE_API_URL=http://localhost:5000/api
```

Start the client:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Environment Variables

### Server (`server/.env`)

| Variable     | Description                        | Example / Default              |
|--------------|------------------------------------|--------------------------------|
| `PORT`       | Server port                        | `5000`                         |
| `MONGO_URI`  | MongoDB connection string          | `mongodb+srv://user:pass@...`  |
| `JWT_SECRET` | Secret key for JWT signing         | A strong random 32+ char string|
| `CLIENT_URL` | Frontend origin for CORS           | `http://localhost:5173`        |

### Client (`client/.env`)

| Variable        | Description           | Default                      |
|-----------------|-----------------------|------------------------------|
| `VITE_API_URL`  | Backend API base URL  | `/api` (proxied via Vite)    |

---

## Features

### User Features
- Register and login with JWT authentication
- Focus monitoring starts automatically after login
- **Away-time tracking**: detects tab switches via `visibilitychange` event, records leave time, return time, and away duration
- **Focus Activity Log**: displays all away events in a table on the dashboard
- Detects browser/window blur (`blur` event)
- Detects user inactivity (configurable threshold)
- 30-second buzzer alarm using Web Audio API when focus is lost
- Alarm auto-stops when user returns to the tab
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

### Away Time
| Method | Endpoint                   | Auth     | Description                        |
|--------|----------------------------|----------|------------------------------------|
| POST   | `/api/away-time`           | User     | Record a tab-switch away event     |
| GET    | `/api/away-time/:sessionId`| User     | Get away logs for a session        |

---

## Focus Detection Logic

The system listens for multiple browser events:

1. **`document.visibilitychange`** — fires when the user switches tabs
2. **`window.blur`** — fires when the browser window loses focus
3. **User activity events** — mousedown, mousemove, keydown, touchstart, click, scroll

### Away-Time Tracking
When the user leaves the tab:
1. The leave timestamp is recorded
2. When they return, the return timestamp and away duration (in seconds) are calculated
3. The data is sent to `POST /api/away-time` and stored in the `AwayLog` collection
4. The **Focus Activity Log** table on the dashboard updates automatically

### Alarm System
- Inactivity beyond the configured threshold triggers a 30-second buzzer alarm
- The alarm uses dual oscillators (sawtooth + square) with LFO modulation for maximum impact
- Returning to the tab stops the alarm immediately
- A violation is logged to the backend with the reason and timestamp

---

## Deployment

### Database → MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user (Database Access → Add New Database User)
3. Whitelist all IPs: Network Access → Add IP Address → `0.0.0.0/0`
4. Get connection string: Database → Connect → Drivers → Copy the URI
5. Replace `<username>` and `<password>` in the URI with your credentials

### Backend → Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory**: `focus-monitor/server`
5. Set **Build Command**: `npm install`
6. Set **Start Command**: `node server.js`
7. Add environment variables:

| Key          | Value                                      |
|--------------|--------------------------------------------|
| `MONGO_URI`  | Your MongoDB Atlas connection string       |
| `JWT_SECRET` | A strong random string (32+ characters)    |
| `CLIENT_URL` | `*` (update to frontend URL after deploy)  |

8. Click **Create Web Service** and wait for deploy to finish
9. Copy the Render URL (e.g. `https://your-app.onrender.com`)

### Frontend → Vercel / Render
1. Go to [vercel.com](https://vercel.com) → New Project (or Render → New Static Site)
2. Connect your GitHub repo
3. Set **Root Directory**: `focus-monitor/client`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. Add environment variable:

| Key            | Value                                          |
|----------------|-------------------------------------------------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api`         |

7. Deploy and copy the frontend URL
8. **Go back to Render backend** → update `CLIENT_URL` to your frontend URL

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
