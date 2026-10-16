# Juddster site

Static site plus a tiny Express backend that stores interest-list sign-ups.

- `public/` - the website
- `server.js` - serves the site, `POST /api/interest` saves a sign-up, `GET /admin?key=ADMIN_KEY` lists them (add `&format=csv` to download)

Deploy on Render as a Node web service: build `npm install`, start `npm start`, environment variable `ADMIN_KEY` set to a secret of your choice. Attach a persistent disk at `/data` and set `DATA_FILE=/data/interest.json` so sign-ups survive redeploys.
