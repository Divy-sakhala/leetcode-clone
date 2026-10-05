# Development notes

Decisions I made along the way, and what I'd change next.

## Design decisions

**JWT in a cookie, plus a Redis blocklist for logout.**
A plain JWT can't be revoked: logging out on the client just deletes the cookie, and the token itself stays valid until it expires. On logout I store the token in Redis with an expiry equal to the token's own, and both auth middlewares check that list. The list only ever holds tokens that are still unexpired, so it stays small. The cost is one Redis lookup per authenticated request, which is fine at this size.

**Waiting for both databases before listening.**
MongoDB and Redis connect in parallel (`Promise.all`) and the server only starts listening once both are ready. Every authenticated request checks Redis, so accepting traffic before Redis is connected would just mean failed requests.

**Validating problems with their own reference solutions.**
When an admin creates a problem, every reference solution is run through Judge0 against the test cases, and the problem is rejected if any of them fail. It's slower to create a problem, but it catches a typo in an expected output before users get "wrong answer" on a correct solution.

**Judge0 batch submissions + polling.**
Each test case is a separate Judge0 submission, sent as one batch request. Judge0 returns tokens immediately, so the backend polls the batch once a second until every result is finished. A webhook callback would avoid polling, but that needs a publicly reachable URL, which a local setup doesn't have.

**Run vs Submit.**
Run uses the visible test cases and doesn't store anything. Submit uses the hidden test cases and stores a submission. Users can iterate freely without spamming their history.

**Direct-to-Cloudinary video uploads.**
The backend only signs the upload; the browser sends the file straight to Cloudinary. Large videos never go through my server, and the API secret never leaves the backend. After the upload, the backend checks the asset actually exists on Cloudinary before saving its metadata.

**AI tutor scoped to the problem.**
The system prompt includes the current problem's description, examples and starter code, and tells the model to stick to that problem and prefer hints over full solutions. That keeps the chat useful and stops it from turning into a general chatbot on my API key.

## What I'd do next

- Rate-limit `/submission/*` and `/ai/chat`. Both call paid APIs.
- Stop sending reference solutions with problem details; only unlock them after an accepted submission.
- Read the admin role from the database instead of the JWT, so demotions apply immediately.
- Cascade deletes: removing a problem should also remove its submissions, video (including the Cloudinary asset), and `problemSolved` entries.
- Build the "Update Problem" page. The API already supports it.
- Move the API URL and CORS origin into environment variables and deploy it.
- Cache the problem list in Redis, and add pagination.
- Support more than one tag per problem.
