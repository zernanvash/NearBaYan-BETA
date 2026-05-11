# NearBaYan Beta Deployment

## What To Deploy

NearBaYan Beta has two deployable pieces:

- Backend API: repo root, starts with `npm start`
- Prototype frontend: `prototype-frontend/`, static Node server starts with `npm run frontend`

For public mobile testing, deploy the backend first, then point the frontend API meta tag to the deployed backend URL.

## Backend

Recommended quick hosts: Render, Railway, Fly.io, or any Node 18+ VPS.

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required production environment:

```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER/nearBaYan?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_production_secret
JWT_EXPIRES_IN=7d
CLIENT_URLS=https://your-frontend-domain.example.com
```

Health check:

```bash
GET https://your-backend-domain.example.com/health
```

## Frontend

Before deploying, edit `prototype-frontend/index.html`:

```html
<meta name="nearbayan-api-base" content="https://your-backend-domain.example.com" />
```

Deploy options:

- Static host: Netlify, Vercel, GitHub Pages
- Node static server: `npm run frontend`

If using the Node static server, set:

```bash
FRONTEND_PORT=3000
```

## Mobile Test Checklist

1. Open the frontend URL on a phone.
2. Create a new account from Register.
3. Sign out, then sign in with that account.
4. Create one request, one question, one item, and one lost/found report.
5. Confirm the backend health indicator says online.
6. In MongoDB, confirm `users`, `posts`, `items`, and `lostfounds` collections receive records.

## Local Beta Smoke Test

```bash
npm run dev:memory
npm run frontend
```

Open:

```text
http://localhost:3003
```
