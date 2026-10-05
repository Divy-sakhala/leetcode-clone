# LeetCode Clone

A full-stack coding practice platform: browse problems, write code in an in-browser editor, run it against test cases, submit solutions, watch video editorials, and ask an AI tutor for hints.

## Tech stack

- **Frontend:** React 19, Vite, Redux Toolkit, React Router, Tailwind CSS + daisyUI, Monaco Editor, React Hook Form + Zod
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), Redis (JWT blocklist on logout), JWT auth via cookies
- **Services:** Judge0 (code execution), Google Gemini (AI doubt solver), Cloudinary (video editorials)

## Features

- Sign up / log in with JWT cookie auth and logout token blocklisting in Redis
- Problem list, problem page with multi-language editor (C++, Java, JavaScript)
- Run against visible test cases and submit against hidden ones via Judge0
- Submission history per problem
- Admin panel: create, update, and delete problems; upload and delete video solutions
- AI chat assistant scoped to the current problem

## Project structure

```
backend/    Express API (src/index.js entry point)
frontend/   React + Vite client
```

## Getting started

Prerequisites: Node.js 20+, a MongoDB database, a Redis instance, and API keys for Judge0 (RapidAPI), Gemini, and Cloudinary.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in your own values
npm start              # runs on http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev            # runs on http://localhost:5173
```

The frontend expects the API at `http://localhost:3000` (see `frontend/src/utils/axiosClient.js`), and the backend allows CORS from `http://localhost:5173`.

## Documentation

- `BACKEND.md` / `BACKEND.html` — backend walkthrough
- `PROJECT_GUIDE.html` — project guide
- `LeetCode_Clone_Backend_Deep_Dive.pdf` — backend deep dive
