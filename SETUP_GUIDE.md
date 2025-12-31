# Quick Setup Guide

## What You Need to Do

### 1. Install Node Modules

```bash
# Install backend dependencies
cd Spur_Assignment/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Create PostgreSQL Database

Run this command in your terminal:

```bash
createdb ai_chat_db
```

If that doesn't work, use psql:

```bash
psql -U postgres
CREATE DATABASE ai_chat_db;
\q
```

### 3. Run Database Migrations

```bash
cd Spur_Assignment/backend
npm run migrate
```

You should see: ✅ Migration completed

### 4. Configure Environment Variables

**Backend .env** (already created at `backend/.env`):

- Replace `username` and `password` in DATABASE_URL with your PostgreSQL credentials
- Add your Gemini API key where it says `YOUR_GEMINI_API_KEY_HERE`

**Frontend .env** (already created at `frontend/.env`):

- No changes needed!

### 5. Start Redis (Optional)

If you have Redis installed:

```bash
redis-server
```

If you don't have Redis, skip this step - the app will work fine without it!

### 6. Start the Backend

Open a terminal:

```bash
cd Spur_Assignment/backend
npm run dev
```

You should see: ✅ Server is running on http://localhost:3000

### 7. Start the Frontend

Open another terminal:

```bash
cd Spur_Assignment/frontend
npm run dev
```

You should see: Local: http://localhost:5173

### 8. Open Your Browser

Go to: **http://localhost:5173**

Try asking: "What's your return policy?"

---

## What's in Your .env Files

### backend/.env

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/ai_chat_db
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-pro
GEMINI_MAX_TOKENS=500
GEMINI_TEMPERATURE=0.7
LLM_HISTORY_LIMIT=10
CORS_ORIGIN=http://localhost:5173
```

### frontend/.env

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## Troubleshooting

**"createdb: command not found"**

- Use the psql method instead

**"Database connection failed"**

- Check your PostgreSQL username/password in DATABASE_URL
- Make sure PostgreSQL is running

**"Gemini API error"**

- Make sure your API key is valid
- Get a key from: https://makersuite.google.com/app/apikey

**"Redis connection failed"**

- The app will still work! Redis is optional for caching

---

## Summary

1. ✅ .env files created (just add your Gemini API key)
2. ✅ Run `npm install` in both folders
3. ✅ Run `createdb ai_chat_db` in terminal
4. ✅ Run `npm run migrate` in backend folder
5. ✅ Start backend with `npm run dev`
6. ✅ Start frontend with `npm run dev`
7. ✅ Open http://localhost:5173

That's it! 🚀
