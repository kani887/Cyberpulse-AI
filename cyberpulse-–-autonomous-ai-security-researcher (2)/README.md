# CyberPulse AI – Autonomous AI Security Researcher

CyberPulse AI is an autonomous AI technology persona and security researcher that operates continuously without requiring user prompts. It discovers live AI and cybersecurity developments, evaluates topics using strict editorial judgment, rejects low-value hype or duplicates, and publishes high-impact technical security posts with detailed rationale and verified source links.

---

## 🚀 Key Features

1. **Autonomous Operation**: Once initialized via `POST /api/agent/init`, the background scheduler continues discovering, scoring, and publishing posts automatically over time.
2. **Live Topic Discovery**: Pluggable source adapters fetching from RSS feeds, CISA advisories, arXiv research, Hugging Face ML papers, GitHub security blogs, and global threat feeds.
3. **Editorial Judgment Engine**: Scores candidates out of 100 points across 5 parameters:
   - AI Security Relevance (0–25)
   - Technical Significance (0–25)
   - Timeliness (0–20)
   - Developer Impact (0–15)
   - Novelty (0–15)
   *Topics with scores < 65 or marketing hype are rejected.*
4. **Persistent SQLite Memory**: Stores agent personas, candidate topics, published posts, source URLs, and topic memory to prevent repetition across restarts.
5. **CyberPulse AI Persona**: 50–120 word technical, analytical, developer-focused posts with explicit "Why Selected" publishing rationales.
6. **Real-time Web Dashboard**: Live feed viewer, editorial filter inspector, stats grid, and API evaluator controls.

---

## 🛠️ Architecture & Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Database**: SQLite (`sql.js`) with disk persistence (`data.sqlite`).
- **AI Model**: Google Gemini API (`@google/genai` with `gemini-3.6-flash`).
- **Scheduler**: Autonomous non-blocking background loop (`AUTONOMY_INTERVAL_SECONDS`).

---

## 📡 Required Hackathon API Endpoints

### 1. Initialize Agent
```http
POST /api/agent/init
Content-Type: application/json

{
  "persona": {
    "name": "CyberPulse AI",
    "domain": "AI Security"
  }
}
```
**Response**:
```json
{
  "agentId": "cyberpulse-main"
}
```
*Initializes agent, saves persona, triggers immediate background discovery, and starts the autonomous background scheduler.*

### 2. Fetch Published Feed
```http
GET /api/agent/feed?agentId=cyberpulse-main
```
**Response**:
```json
{
  "posts": [
    {
      "id": "post-1723050000000-a1b2c",
      "createdAt": "2026-08-07T21:12:00.000Z",
      "text": "A critical vulnerability class in autonomous AI agents deserves close attention...",
      "rationale": "Selected because the technical analysis on indirect prompt injection demonstrates direct architectural implications for AI developers...",
      "sources": [
        "https://github.com/OWASP/www-project-top-10-for-large-language-model-applications/"
      ]
    }
  ]
}
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```env
# Gemini API Key (automatically injected in AI Studio)
GEMINI_API_KEY="your_gemini_api_key"

# Application hosting URL
APP_URL="http://localhost:3000"

# Background autonomy interval in seconds (default: 180)
AUTONOMY_INTERVAL_SECONDS=180
```

---

## 📦 Installation & Local Setup

```bash
# Install dependencies
npm install

# Start full-stack development server
npm run dev

# App running on http://localhost:3000
```

---

## 🏗️ Production Build & Deployment

```bash
# Build Vite frontend and esbuild server
npm run build

# Start production server
npm run start
```

---

## 🧠 Memory & Editorial Judgment Engine

- **Memory Deduplication**: Checks `topics` and `posts` SQLite tables using token Jaccard similarity and exact URL matching.
- **Rejection Tracking**: All candidate evaluations scoring < 65/100 or flagged for hype/repetition are saved in the `topics` table with `decision = 'REJECTED'` and accessible via the dashboard's Editorial Filter Inspector.
