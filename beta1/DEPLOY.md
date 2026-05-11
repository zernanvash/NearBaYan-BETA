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
   - **Branch:** `main` (which contains your beta1 code)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Scroll down to **Environment Variables** and add exactly what you have in your local `.env`:
   - `MONGO_URI` : *(Your MongoDB Atlas URL)*
   - `JWT_SECRET` : `any_random_long_string_here`
   - `NVIDIA_API_KEY` : `nvapi-...` (your actual key)
   - `NVIDIA_BASE_URL` : `https://integrate.api.nvidia.com/v1/chat/completions`
   - `NVIDIA_SAFETY_MODEL` : `nvidia/llama-3.1-nemotron-safety-guard-8b-v3`
6. Click **Create Web Service**. 

*(Once it finishes deploying, Render will give you a live URL like `https://nearbayan-backend.onrender.com`. Copy this URL!)*

---

## Phase 2: Connecting the Frontend

Once you have your Render Backend URL, you must update your code to connect to it.

1. Open `beta1/prototype-frontend/index.html`.
2. Find the meta tag at line 6:
   `<meta name="nearbayan-api-base" content="http://localhost:5000" />`
3. Replace `http://localhost:5000` with your new Render URL (e.g., `https://nearbayan-backend.onrender.com`).
4. Commit and push this change to your GitHub repository.

---

## Phase 3: Deploy the Frontend (Vercel.com)

1. Go to **Vercel.com** and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your `SikapatalaHackathon` GitHub repository.
4. Click **Edit** next to the Root Directory, and change it to `beta1/prototype-frontend` (or just `prototype-frontend` depending on how your repo is structured).
5. Click **Deploy**.

Vercel will immediately give you a live URL (like `https://nearbayan.vercel.app`). You can open this on any phone or computer anywhere in the world!
