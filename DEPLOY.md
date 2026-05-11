# NearBaYan Beta Deployment Guide

To use this app outside of `localhost` (e.g., on your phone or sharing with judges), you need to host it on the internet. Because your code is already pushed to GitHub, deployment will be surprisingly fast and completely free!

We will use two industry-standard free platforms for hackathons:
1. **Render.com** (for your Node.js Backend)
2. **Vercel.com** (for your Frontend)

---

## Phase 1: Deploy the Backend (Render.com)

1. Go to **Render.com** and sign in with GitHub.
2. Click **New +** and select **Web Service**.
3. Connect your `SikapatalaHackathon` GitHub repository.
4. Fill out the configuration:
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Scroll down to **Environment Variables** and add your production values:
   - `NODE_ENV` : `production`
   - `MONGO_URI` : *(Your MongoDB Atlas URL)*
   - `JWT_SECRET` : `any_random_long_string_here`
   - `JWT_EXPIRES_IN` : `7d`
   - `CLIENT_URLS` : `https://near-ba-yan-beta.vercel.app`
   - `OPENAI_API_KEY` : *(optional, if AI features are enabled)*
6. Click **Create Web Service**. 

The current backend URL is `https://nearbayan-beta.onrender.com`.

---

## Phase 2: Connecting the Frontend

The frontend is already configured to call the Render backend.

1. Open `prototype-frontend/index.html`.
2. Find the meta tag at line 6:
   `<meta name="nearbayan-api-base" content="https://nearbayan-beta.onrender.com" />`
3. If the backend URL changes later, replace `https://nearbayan-beta.onrender.com` with the new Render URL.
4. Commit and push this change to your GitHub repository.

---

## Phase 3: Deploy the Frontend (Vercel.com)

1. Go to **Vercel.com** and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your `SikapatalaHackathon` GitHub repository.
4. Click **Edit** next to the Root Directory, and change it to `prototype-frontend`.
5. Click **Deploy**.

The current frontend URL is `https://near-ba-yan-beta.vercel.app/`. You can open this on any phone or computer anywhere in the world.
