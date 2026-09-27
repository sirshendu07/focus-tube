# FocusTube — Full-Stack Deployment Guide 🚀

This guide explains how to deploy both the **Backend** and **Frontend** to free, high-performance cloud hosting platforms.

---

## 🏗️ Architecture Overview
- **Backend API**: Node.js + Express hosted on [Render](https://render.com) or [Railway](https://railway.app).
- **Frontend SPA**: React + Vite hosted on [Vercel](https://vercel.com).
- **Database**: MongoDB Atlas.

---

## Part 1: Deploy Backend to Render (Free)

1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub repository: `https://github.com/sirshendu07/focus-tube`.
3. Configure the settings:
   - **Name**: `focustube-backend` (or your choice)
   - **Region**: Closest to you (e.g., Singapore / Oregon / Frankfurt)
   - **Root Directory**: `backend` *(Important!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `PORT`: `5002` (or let Render set its default port)
   - `MONGO_URI`: `mongodb+srv://SANJU386:S%40nju12345@sanju.kdjrh0n.mongodb.net/focustube?appName=SANJU`
   - `JWT_SECRET`: `focustube_super_secret_jwt_2026_distractionless`
   - `NODE_ENV`: `production`
5. Click **Create Web Service**.
6. Once deployed, copy your backend URL (e.g., `https://focustube-backend.onrender.com`).

---

## Part 2: Deploy Frontend to Vercel (Free)

1. Go to [vercel.com](https://vercel.com/) and click **Add New...** > **Project**.
2. Select your repository: `sirshendu07/focus-tube`.
3. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click Edit and select `frontend` *(Important!)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Paste your Render backend URL from Part 1 (e.g. `https://focustube-backend.onrender.com`).
5. Click **Deploy**.
6. In ~30 seconds, Vercel will give you a live production URL (e.g., `https://focus-tube-xyz.vercel.app`)!

---

## Part 3: Verify Everything Works Live
1. Open your Vercel frontend URL.
2. Sign up with a new account.
3. Paste any YouTube link (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`).
4. Watch distraction-free, take timestamped notes, and update revision status to test the cloud database!
