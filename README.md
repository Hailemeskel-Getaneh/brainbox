# 🧠 BrainBox

**Your personal, self-hosted knowledge vault.**

BrainBox is a lightweight web application designed to help you capture, organize, and manage your thoughts, topics, and notes. It features a modern React frontend and a robust Node.js/Express backend backed by PostgreSQL, Dockerized.

-------

## 🚀 Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, TypeScript, Lucide Icons
*   **Backend**: Node.js, Express.js
*   **Database**: PostgreSQL
*   **Infrastructure**: Docker, Docker Compose, Github actions

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js** (v18 or higher)
2.  **npm** (comes with Node.js)
3.  **Docker Desktop** (Required for the database)
4.  **Git**

---

## 📥 Installation & Setup Guide

Follow these steps to set up the project locally.

### 1. Clone the Repository
```bash
git clone <repository_url>
cd brainbox
```

### 2. Install Dependencies

You need to install dependencies for both the Frontend and Backend.

**Backend:**
```bash
cd Backend
npm install
cd ..
```

**Frontend:**
```bash
cd Frontend
npm install
cd ..
```

### 3. Start the Database 🐳

The project uses a PostgreSQL database running in a Docker container. **You do NOT need to download or install PostgreSQL manually.** Docker handles everything.

1.  **Start Docker Desktop** on your machine.
2.  Run the following command in the root directory:

```bash
docker compose up -d db
```

*This starts the PostgreSQL container in the background.*

#### Database Credentials (Pre-configured)
The project is set up to work out-of-the-box with these default credentials. You don't need to change them for local development.
*   **Host**: `localhost`
*   **Port**: `5432`
*   **User**: `postgres`
*   **Password**: `postgres`
*   **Database**: `brainbox`

---

## 🏃‍♂️ Running the Application

You need to run the Backend and Frontend in separate terminal windows.

### Step 1: Start the Backend server

In terminal 1:
```bash
cd Backend
npm start
```
*   The server will start on `http://localhost:5000`.
*   It will automatically connect to the Docker database.
*   **First Run Note**: The database tables (`topics`, `notes`) are created automatically by the `npm start` script (checks `src/db/init.js`).

### Step 2: Start the Frontend UI

In terminal 2:
```bash
cd Frontend
npm run dev
```
*   The frontend will start on `http://localhost:5173` (or similar).
*   Open this URL in your browser to use the app.

---

## ✅ Verification & Testing

### Health Check
Visit `http://localhost:5000/api/health` in your browser. You should see:
```json
{"status":"ok","message":"Backend is running"}
```

### Running Tests
To run the backend test suite:
```bash
cd Backend
npm test
```

### Docker Status Check
To ensure your database is running:
```bash
docker ps
```
You should see a container named `brainbox-db-1` (or similar) listed.

---

## 📖 How to Use BrainBox

1.  **Landing Page**: Open the frontend URL. You will see the BrainBox Welcome screen.
    *   *Check*: The "System Status" indicator should be GREEN (Online).
2.  **Get Started**: Click the "Get Started" button to go to the Dashboard.
3.  **Create a Topic**:
    *   Enter a name (e.g., "React Learning") in the input box.
    *   Click "Add Topic".
4.  **Manage Notes**:
    *   Click on any Topic card.
    *   Type your note in the text area and press `Enter` or click the `+` button.
    *   Your note is saved instantly.
    *   Delete notes using the Trash icon.

---

## ⚠️ Troubleshooting

**Error: `connect ECONNREFUSED 127.0.0.1:5432`**
*   **Cause**: The database is not running.
*   **Fix**: Ensure Docker Desktop is open, then run `docker compose up -d db`.

**Error: `Cannot find module...` in Frontend**
*   **Cause**: Dependencies missing.
*   **Fix**: Run `npm install` inside the `Frontend` directory again.

**UI looks broken / small**
*   **Fix**: This was resolved by updating `index.css`. Hard refresh your browser (Ctrl+F5).
