# LeetCode Clone

A coding practice site: pick a problem, write a solution in the browser, run it against sample cases, and submit it against hidden ones. There's also an AI tutor that knows which problem you're on, and admins can attach video walkthroughs to problems.

## Why I built it

I wanted to understand how a real full-stack app fits together beyond CRUD: cookie-based auth with logout that actually invalidates tokens, running untrusted code through an external judge, direct-to-cloud uploads, and putting an LLM behind an API with some guardrails. A LeetCode-style site needs all of those, so it was a good excuse to build each piece.

## What works

- Sign up / log in with a JWT stored in a cookie; logout blocklists the token in Redis
- Problem list with difficulty and tag filters, and a "solved" filter per user
- Problem page with a Monaco editor (C++, Java, JavaScript), starter code per language
- Run against visible test cases, submit against hidden ones (via Judge0)
- Submission history with status, runtime and memory
- Admin panel: create and delete problems, and manage video solutions. New problems are only saved if every reference solution passes the test cases.
- Video solutions uploaded directly to Cloudinary using signed uploads
- AI chat (Gemini) scoped to the current problem

## Stack

React 19 + Vite, Redux Toolkit, Tailwind/daisyUI, Monaco · Node + Express 5 · MongoDB (Mongoose) · Redis · Judge0 CE (RapidAPI) · Gemini · Cloudinary

## Running it locally

You'll need Node 20+, a MongoDB database, a Redis instance, and keys for Judge0 on RapidAPI, Gemini, and Cloudinary.

```bash
# backend (http://localhost:3000)
cd backend
npm install
cp .env.example .env    # fill in your own values
npm start

# frontend (http://localhost:5173), in another terminal
cd frontend
npm install
npm run dev
```

Backend tests (validation, auth middleware, error mapping, the Judge0 client with a mocked API):

```bash
cd backend
npm test
```

To make yourself an admin, set `role: "admin"` on your user document in MongoDB. After that you can create other admins from the app.

## Known limitations

- The frontend's API URL and the backend's CORS origin are hardcoded to localhost, so deploying needs a small config change.
- Problem details include the reference solutions (the Solutions tab shows them), so they're visible to anyone logged in, even before solving.
- Admin access is checked from the role inside the JWT. If someone is demoted, it only takes effect when their token expires (1 hour).
- No rate limiting on code runs or AI chat, both of which use paid third-party APIs.
- Deleting a problem doesn't clean up its submissions or video.
- Editing a problem works through the API (`PUT /problem/update/:id`) but has no page yet; the "Update Problem" button on the admin panel leads nowhere.
- No pagination on the problem list, and each problem has a single tag.

More detail: [docs/backend.md](docs/backend.md) for how the backend works, and [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md) for design decisions and what I'd do next.
