# Backend notes

How the Express API is put together. For setup, see the main README.

## Layout

```
backend/src/
  index.js          app setup, middleware, routes, startup
  config/           MongoDB and Redis connections
  models/           Mongoose schemas: user, problem, submission, solutionVideo
  middleware/       userMiddleware / adminMiddleware (JWT + Redis blocklist)
  controllers/      route handlers
  routes/           routers mounted under /user, /problem, /submission, /ai, /video
  utils/            input validation, Judge0 client
```

On startup the server connects to MongoDB and Redis in parallel and only starts listening once both are up.

## Data model

**user**: `firstName`, `lastName`, `emailId` (unique, lowercased, immutable), `password` (bcrypt hash), `role` (`user` | `admin`), `problemSolved` (problem ids). Deleting a user also deletes their submissions (a `findOneAndDelete` post hook).

**problem**: `title`, `description`, `difficulty` (`easy` | `medium` | `hard`), `tags` (one of `array`, `linkedList`, `graph`, `dp`), plus four arrays:

- `visibleTestCases`: input, output, explanation (shown to the user, used by Run)
- `hiddenTestCases`: input, output (used by Submit)
- `startCode`: starter code per language
- `referenceSolution`: a working solution per language

**submission**: `userId`, `problemId`, `code`, `language`, `status` (`pending` | `accepted` | `wrong` | `error`), `runtime`, `memory`, `testCasesPassed`, `testCasesTotal`, `errorMessage`. Indexed on `{ userId, problemId }` since that's how submission history is queried.

**solutionVideo**: `problemId`, `userId`, `cloudinaryPublicId`, `secureUrl`, `thumbnailUrl`, `duration`.

## Auth

- Register/login sign a JWT (`_id`, `emailId`, `role`, 1 hour expiry) and set it as a `token` cookie.
- `userMiddleware` verifies the token, loads the user, and rejects the token if it's in the Redis blocklist. The user ends up on `req.result`.
- `adminMiddleware` does the same and also requires `role === 'admin'` in the token.
- Logout writes `token:<jwt>` to Redis with the same expiry as the token, so a logged-out token can't be reused even though JWTs are stateless. Redis isn't used for anything else yet.
- Public registration always creates a `user`. Admins are created through `POST /user/admin/register` by an existing admin.

## Running code (Judge0)

`utils/problemUtility.js` talks to Judge0 CE on RapidAPI.

1. Map the language to a Judge0 id (`c++` 54, `java` 62, `javascript` 63).
2. `submitBatch` sends one submission per test case and gets back tokens.
3. `submitToken` polls the batch once a second until every result has `status_id > 2` (finished).
4. The controller counts passed test cases (status 3) and records a verdict.

- **Run** (`/submission/run/:id`) uses the visible test cases and doesn't save anything.
- **Submit** (`/submission/submit/:id`) uses the hidden test cases, stores a submission, and adds the problem to the user's `problemSolved`.
- **Creating or updating a problem** runs every reference solution against the visible test cases first and refuses to save if any of them fail. That catches broken test cases before users ever see them.

## AI tutor

`POST /ai/chat` forwards the chat history to Gemini, with a system prompt that includes the current problem's title, description, examples and starter code, and restricts the model to helping with that problem. The model is `gemini-1.5-flash`.

## Video solutions

Uploads go straight from the browser to Cloudinary so the video never passes through this server:

1. `GET /video/create/:problemId` returns a signed upload request (signature, timestamp, public id).
2. The admin's browser uploads the file to Cloudinary with that signature.
3. `POST /video/save` checks the asset exists on Cloudinary and stores its metadata.

`GET /problem/problemById/:id` includes the video URL, thumbnail and duration if a video exists.

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/user/register` | none | Create account and log in |
| POST | `/user/login` | none | Log in |
| POST | `/user/logout` | user | Log out (blocklists token) |
| GET | `/user/check` | user | Current user |
| POST | `/user/admin/register` | admin | Create an admin |
| DELETE | `/user/deleteProfile` | user | Delete own account |
| POST | `/problem/create` | admin | Create problem |
| PUT | `/problem/update/:id` | admin | Update problem |
| DELETE | `/problem/delete/:id` | admin | Delete problem |
| GET | `/problem/getAllProblem` | user | List problems |
| GET | `/problem/problemById/:id` | user | Problem details |
| GET | `/problem/problemSolvedByUser` | user | Problems the user solved |
| GET | `/problem/submittedProblem/:pid` | user | User's submissions for a problem |
| POST | `/submission/run/:id` | user | Run against visible tests |
| POST | `/submission/submit/:id` | user | Submit against hidden tests |
| POST | `/ai/chat` | user | Ask the AI tutor |
| GET | `/video/create/:problemId` | admin | Get a signed upload request |
| POST | `/video/save` | admin | Save uploaded video metadata |
| DELETE | `/video/delete/:problemId` | admin | Delete a problem's video |

## Environment variables

See `backend/.env.example`.

| Variable | Used for |
|---|---|
| `PORT` | HTTP port (frontend expects 3000) |
| `DB_CONNECT_STRING` | MongoDB connection string |
| `JWT_KEY` | Signing JWTs |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS` | Redis connection |
| `JUDGE0_KEY` | RapidAPI key for Judge0 CE |
| `GEMINI_KEY` | AI tutor |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Video uploads |
