# Arrow Escape

A sleek, satisfying, logic-based grid puzzle game inspired by directional escape mechanics. Untangle interlocked arrows, plan your sequence, and guide every arrow safely off the board. Features a full production-ready Authentication and Cloud Save persistence architecture with offline Guest Mode.

---

## 🎯 Gameplay Mechanics

1. **Grid-Based Directional Logic**: Each cell contains an arrow pointing **Up**, **Down**, **Left**, or **Right**.
2. **Raycast Collision Check**: When you tap an arrow, it inspects every cell along its forward path to the grid boundary.
3. **Obstacle Detection**: If another active arrow blocks its path, the move is rejected with an audible recoil thud, an directional bump animation, and obstacle highlight.
4. **Unblocked Freedom**: If the path to the perimeter is completely clear, the arrow flies gracefully off the board and is removed.
5. **Victory Condition**: Clear all arrows to complete the puzzle. Earn up to **3 Stars** by matching or beating the Par move count!
6. **100% Solvability Guarantee**: Handcrafted campaign levels are validated, and procedurally generated puzzles use reverse-assembly synthesis with forward solver verification to guarantee every puzzle is solvable.

---

## ☁️ Persistence & Authentication System

### 1. Seamless Guest Mode
- Anyone can start playing immediately without signing in or creating an account.
- Game progress is automatically saved to browser LocalStorage whenever a level is completed.
- Handles corrupted or unavailable LocalStorage gracefully using an in-memory fallback.
- Never resets or wipes a guest's local progress if offline or if Firebase is unreachable.

### 2. Multi-Provider Authentication
- **Google Sign-In**: Quick 1-click popup authentication.
- **Email & Password**: Registration with optional display name and secure password requirements.
- **Password Reset**: Self-service email reset flow.
- **Persistent Sessions**: Logged-in state is retained across browser refreshes and tabs.

### 3. Cloud Saves (Cloud Firestore)
- Automatically synchronizes level progress, best moves, best times, par stars, and game settings to the user's private Firestore document (`/users/{uid}`).
- **Zero Data Loss**: Progress saves to local storage first, then seamlessly streams to the cloud.
- **Live Sync Indicator**: Visual feedback in the header showing whether saves are `Cloud Saved`, `Saving...`, `Guest Save`, or `Offline`.

### 4. Smart Guest-to-Account Migration
- When a guest signs in or creates an account:
  - If the cloud account is brand new, guest progress is automatically uploaded.
  - If the cloud account already has game progress that differs from the current device, an interactive **Sync Conflicting Saves** dialog offers three transparent choices:
    1. **Smart Merge (Recommended)**: Combines both saves, preserving all completed levels and highest star ratings.
    2. **Use Cloud Save**: Restores the cloud progress.
    3. **Use Local Device Save**: Overwrites the cloud save with local device progress.

### 5. Hardened Security Rules
- Built with zero-trust access control in `firestore.rules`:
  - Default-deny catch-all safety net.
  - Documents under `/users/{userId}` can only be read, created, updated, or deleted by the authenticated user whose `request.auth.uid == userId`.
  - Comprehensive schema validation enforcing string lengths, map types, and immutable `userId` fields.
  - No client query scraping permitted.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Database**: Cloud Firestore
- **Authentication**: Firebase Authentication
- **Audio**: Web Audio API (native browser synthesis, 100% offline)
- **Effects**: Canvas Confetti

---

## 🚀 Development & Setup

### Prerequisites
- Node.js 20.19+ or 22.12+ (required by Vite 8)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/arrow-escape.git

# Enter project directory
cd arrow-escape

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔧 Firebase Console Setup Instructions

If deploying to your own Firebase project:

1. **Create / Open Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Click **Add project** or select your existing project.

2. **Enable Authentication Providers**:
   - In the left sidebar, navigate to **Build** → **Authentication** → **Sign-in method**.
   - Enable **Google**:
     - Toggle Enable, set project support email, and save.
   - Enable **Email/Password**:
     - Toggle Enable and save.

3. **Enable Cloud Firestore**:
   - Navigate to **Build** → **Firestore Database**.
   - Click **Create database** (start in production or test mode).
   - Select your preferred cloud region.

4. **Deploy Firestore Rules**:
   - Go to the **Rules** tab in Firestore Database.
   - Paste the contents of `firestore.rules` from this repository and click **Publish**.
   - Or deploy via Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules
     ```

5. **Register Web App**:
   - In Project Settings, click the **Web icon (`</>`)** to add a web application.
   - Copy the configuration object into `firebase-applet-config.json` or configure the `.env` variables as outlined in `.env.example`.

---

## 🌐 Netlify Deployment

This project includes a production `netlify.toml` for static hosting:

1. Push your repository to GitHub.
2. In Netlify, click **"Add new site"** → **"Import an existing project"**.
3. Select your repository.
4. Settings are automatically detected:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Under **Site configuration** → **Environment variables**, set any custom Firebase variables if not using `firebase-applet-config.json`.
6. Click **Deploy site**.
7. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**, add your Netlify domain (e.g. `your-app.netlify.app`).

---

## 📄 License

Apache-2.0 License.
