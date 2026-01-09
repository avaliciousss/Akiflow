# ADHD-Friendly Time-Blocking Copilot

A Node.js/TypeScript application implementing an ADHD-friendly task management and time-blocking system based on Stanford research and evidence-based productivity principles.

## 🎯 Features

- **ADHD-Friendly Planning**: Reduces overwhelm with small, achievable steps
- **Smart Time Blocking**: Creates realistic schedules with built-in breaks and buffers
- **Live Focus Sessions**: Real-time guidance with micro-steps and check-ins
- **Derailment Recovery**: Non-judgmental support when things go off track
- **Energy-Aware Scheduling**: Matches tasks to your current energy levels
- **Stanford-Backed Principles**: Monotasking, externalized time, and psychological safety

## 🧠 Core Principles

1. **Reduce Decision Fatigue**: Clear, simple next actions
2. **Time Blindness Support**: Timers, alarms, and visible blocks
3. **Start Small**: Low-friction first tasks to build momentum
4. **Buffer Time**: 20-30% unscheduled time for reality
5. **No Shame**: Warm, supportive, non-judgmental tone

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development
```

### Build

```bash
npm run build
```

### Run Development Server

```bash
npm run dev
```

### Run Production Server

```bash
npm start
```

The server will start at `http://localhost:3000`

## 📚 API Endpoints

### 1. Generate Time-Blocked Schedule

**POST** `/api/plan`

Create a complete time-blocked schedule for your available time window.

**Request Body:**
```json
{
  "available_start": "2026-01-09T09:00:00",
  "available_end": "2026-01-09T17:00:00",
  "tasks": [
    {
      "title": "Write project proposal",
      "estimated_minutes": 45,
      "priority": "high",
      "requires_energy": "high"
    }
  ],
  "energy_level": "medium",
  "preferences": {
    "focus_duration_minutes": 25,
    "break_duration_minutes": 5,
    "buffer_percentage": 0.25
  }
}
```

**Response:**
```json
{
  "summary": "Your 9:00 AM-5:00 PM plan: 3 focus blocks...",
  "blocks": [...],
  "next_action": "Set a 10-minute timer and start: Reply to emails"
}
```

### 2. Start Focus Session

**POST** `/api/sessions/start`

Begin a live focus session with real-time guidance.

**Request Body:**
```json
{
  "task": {
    "title": "Write blog post",
    "estimated_minutes": 30
  },
  "duration_minutes": 30
}
```

### 3. Record Check-In

**POST** `/api/sessions/:sessionId/checkin`

Log progress during a focus session.

**Request Body:**
```json
{
  "completed_work": "Finished the outline",
  "energy_level": "medium",
  "continue_or_adjust": "keep_going"
}
```

### 4. Create Recovery Plan

**POST** `/api/recovery`

Get help after getting derailed or off track.

**Request Body:**
```json
{
  "current_time": "2026-01-09T14:30:00",
  "available_until": "2026-01-09T17:00:00",
  "what_happened": "Got distracted by messages",
  "current_energy": "medium",
  "remaining_tasks": [...]
}
```

### 5. Other Endpoints

- `GET /health` - Health check
- `GET /api/sessions/:sessionId` - Get session details
- `POST /api/sessions/:sessionId/complete-step` - Mark step complete
- `POST /api/sessions/:sessionId/end` - End session
- `GET /api/sessions` - Get all active sessions
- `GET /api/prompt` - View system prompt info

## 📖 Example Usage

See `examples/example-requests.json` for complete request/response examples.

### Example: Quick Planning

```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "available_start": "2026-01-09T09:00:00",
    "available_end": "2026-01-09T12:00:00",
    "tasks": [
      {
        "title": "Reply to emails",
        "estimated_minutes": 20,
        "priority": "low"
      },
      {
        "title": "Code review",
        "estimated_minutes": 30,
        "priority": "medium"
      }
    ],
    "energy_level": "medium"
  }'
```

### Example: Start a Session

```bash
curl -X POST http://localhost:3000/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "title": "Write documentation"
    },
    "duration_minutes": 25
  }'
```

## 🏗️ Architecture

```
src/
├── types/           # TypeScript type definitions
│   └── index.ts
├── engine/          # Core business logic
│   ├── time-blocker.ts      # Time-blocking algorithm
│   └── session-manager.ts   # Session & recovery logic
└── index.ts         # Express API server

config/              # Configuration files
└── system-prompt.json

docs/                # Documentation
└── SYSTEM_PROMPT.md

examples/            # Example requests
└── example-requests.json
```

## 🧩 Key Components

### TimeBlocker

The core scheduling engine that:
- Breaks tasks into manageable blocks
- Adds breaks between focus periods
- Reserves buffer time (20-30%)
- Starts with easy, low-friction tasks
- Respects energy levels

### SessionManager

Handles live focus sessions:
- Breaks tasks into micro-steps
- Manages check-ins
- Adjusts plans based on reality
- Provides derailment recovery
- Tracks session progress

## 🎨 Design Philosophy

### ADHD-Specific Features

1. **Start Small**: First block is always 5-15 minutes
2. **Visible Time**: All blocks have explicit start/end times
3. **One Thing at a Time**: Monotasking enforced
4. **Built-in Flexibility**: 20-30% buffer time
5. **No Shame Language**: Supportive, non-judgmental tone

### Evidence-Based Methods

- **Time Blocking**: Stanford research on focused work
- **Pomodoro-Adjacent**: 25-50 min focus, 5-10 min breaks
- **Monotasking**: Single-task focus per block
- **Externalized Time**: Timers and visible schedules

## 🔧 Configuration

The system prompt and principles are documented in:
- `docs/SYSTEM_PROMPT.md` - Full system prompt documentation
- `config/system-prompt.json` - Structured configuration

These files define:
- Communication style and tone
- Planning workflow
- Block types and durations
- Energy level handling
- Derailment recovery process

## 📊 Block Types

- `focus` - Deep work or concentrated tasks
- `break` - Rest, reset, movement
- `admin` - Quick administrative tasks
- `buffer` - Catch-up time for unexpected events
- `transition` - Context switching time
- `reflection` - Check-in or planning moments

## 🎯 Energy Levels

- `low` - Tired, needs gentle tasks or rest
- `medium` - Normal energy, moderate complexity
- `high` - Peak energy, best for challenging work

## 🤝 Integration

This copilot can be integrated with:
- Calendar apps (Google Calendar, Outlook, etc.)
- Task management tools (Todoist, Asana, etc.)
- Timer applications
- LLM chat interfaces (ChatGPT, Claude, etc.)
- Mobile apps
- Browser extensions

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express
- **API Style**: RESTful JSON

## 📝 Development

### Project Scripts

```bash
npm run build    # Compile TypeScript
npm run dev      # Run with hot reload
npm start        # Run production build
```

### Type Safety

All types are defined in `src/types/index.ts` and enforced throughout the codebase.

## 🌟 Why This Matters

Traditional productivity tools often:
- Assume linear time perception
- Ignore energy fluctuations
- Punish derailment with guilt
- Overfill schedules optimistically
- Use vague, overwhelming language

This copilot instead:
- Externalizes time with visible blocks
- Matches tasks to energy levels
- Supports recovery without shame
- Leaves 20-30% buffer time
- Uses clear, tiny next steps

## 📄 License

MIT

## 🙏 Acknowledgments

Built on research from:
- Stanford studies on multitasking and productivity
- ADHD coaching methodologies
- Evidence-based time management practices
- Pomodoro Technique principles

---

**💙 ADHD-friendly time management at your service!**

For questions or issues, please open an issue on GitHub.
