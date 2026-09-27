# FocusTube 🎥 — Distraction-Free YouTube Study & Revision Tracker

A full-stack web application designed for students and learners who want to watch YouTube educational videos without any algorithmic rabbit holes, comments, recommendation sidebars, or distractions.

---

## ✨ Features Built For Pure Focus

1. **Distraction-Free Video Watching (Zen Mode)**
   - Paste any YouTube link (Full URL, Short Link, Shorts, Embed, or ID).
   - Embedded in an isolated, pure-player frame: **No recommendations, no sidebar suggested videos, no comments**.
   - Includes a **Theater Mode** toggle for total immersion.

2. **User Authentication**
   - Create an account with Name, Email & Password (secure bcrypt hashing).
   - Log in & Log out with persistent JWT authentication.
   - Dedicated user profile with real-time study stats.

3. **Study Playlists & Custom Tracks**
   - Create custom playlists (e.g. *Stanford Algorithms*, *Full Stack Web Dev*, *Calculus III*).
   - Add YouTube videos into playlists with auto-fetched titles & thumbnails.
   - Reorder videos (Move Up / Down).
   - Track track completion progress (% done).

4. **Study & Revision Status Tracking**
   - Explicitly tag every video with:
     - 🔴 **Need Revision** — For topics requiring re-study or practice
     - 🟡 **Slight Revision** — Quick memory brush up
     - 🟢 **Done / Mastered** — Topic completely understood (triggers celebration confetti 🎉)
     - ⚪ **Unwatched**
   - **Revision Command Center**: A dedicated view to see all videos needing revision across all playlists so you can efficiently review before tests and interviews.

5. **Timestamped Study Notes**
   - Real-time notes editor associated with every video.
   - **Clickable Timestamp Bookmarks**: Add bookmarks (e.g. `04:15 - Key Formula`). Clicking the timestamp jumps the video directly to that time.
   - Auto-saves changes as you type.
   - One-click **Copy Notes** or **Download as Markdown (.md)**.

6. **Built-in Pomodoro Focus Timer**
   - 25m Focus / 5m Short Break / 15m Long Rest intervals right in the navbar.

---

## 🚀 How to Run

### Option 1: Quick Launch (Windows)
Double-click `start.bat` inside `D:\project\focus-tube`. It will open both the backend and frontend in separate terminals.

### Option 2: Manual Launch

#### 1. Start Backend:
```bash
cd D:\project\focus-tube\backend
npm start
```
*Backend runs on: `http://localhost:5002`*

#### 2. Start Frontend:
```bash
cd D:\project\focus-tube\frontend
npm run dev
```
*Frontend runs on: `http://localhost:5174`*

Open your browser and visit: **`http://localhost:5174`**

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Bcrypt
- **Metadata**: YouTube oEmbed integration (free, no API key required)
