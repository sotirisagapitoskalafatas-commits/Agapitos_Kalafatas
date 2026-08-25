# Atlas AI Agent

> Full-stack AI agent with voice, memory, and a web interface — powered by Google Gemini AI.

Built by **Agapitos Kalafatas** | Full-Stack SaaS Architect & Digital Operations Strategist

Inspired by [jaredrhod/fullstack-agent](https://github.com/jaredrhod/fullstack-agent) and [jaredrhod/backtalk](https://github.com/jaredrhod/backtalk), reimagined with **Gemini AI** as the brain.

## What You Get

- **Brain**: Google Gemini AI for conversations, code generation, and tool use
- **Voice**: Push-to-talk with local Whisper STT + Kokoro TTS (free, offline)
- **Memory**: Persistent text-file memory vault that remembers across sessions
- **Web UI**: Beautiful chat interface + personal services website
- **Supabase**: Chat history persistence in the cloud

## Quick Start

### 1. Get a Gemini API Key

Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.

### 2. Set Up

```bash
# Clone the repo
git clone https://github.com/sotirisagapitoskalafatas-commits/Agapitos_Kalafatas.git
cd Agapitos_Kalafatas

# Set your Gemini API key (Option A: environment variable)
set GEMINI_API_KEY=your_key_here          # Windows
export GEMINI_API_KEY=your_key_here       # Mac/Linux

# Option B: create a file
echo your_key_here > config/.gemini_key
```

### 3. Run the Agent (CLI)

```bash
# Windows
start.bat

# Mac/Linux
chmod +x start.sh
./start.sh
```

### 4. Run the Web Interface

```bash
cd web
npm install
npm run dev
# Open http://localhost:3000
```

## Architecture

```
Agapitos_Kalafatas/
├── agent/                 # Python AI Agent
│   ├── brain.py          # Gemini AI brain (streaming)
│   ├── ears.py           # Whisper STT (speech-to-text)
│   ├── mouth.py          # Kokoro/ElevenLabs TTS (text-to-speech)
│   ├── ptt.py            # Push-to-talk listener
│   ├── memory.py         # Persistent memory vault
│   ├── signals.py        # Visualizer state bus
│   ├── config.py         # Configuration loader
│   └── main.py           # Entry point
├── web/                   # Next.js Web Interface
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Landing page
│       │   ├── chat/page.tsx     # Chat interface
│       │   └── api/chat/route.ts # Gemini API proxy
│       └── lib/
│           └── supabase.ts       # Supabase client
├── config/                # Configuration files
│   ├── agent.json        # Agent configuration
│   └── supabase-schema.sql
└── agent/memory/          # Memory vault files
```

## Usage

### Voice Mode (CLI)
```bash
python -m agent.main          # Voice mode with PTT
python -m agent.main --chat   # Text-only chat
python -m agent.main --model gemini-2.5-pro  # Use different model
```

### Chat Commands
- Say **"goodbye atlas"** to end voice session
- Say **"usage report"** for session stats
- Say **"clear context"** to reset conversation

### Web Interface
- Landing page: `http://localhost:3000`
- Chat: `http://localhost:3000/chat`

## Supabase Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open the SQL Editor
3. Run the contents of `config/supabase-schema.sql`
4. Copy your anon key to `.env.local`

## Tech Stack

| Component | Technology |
|-----------|-----------|
| AI Brain | Google Gemini 2.5 Flash |
| Speech-to-Text | faster-whisper (local) |
| Text-to-Speech | Kokoro (local) / ElevenLabs |
| Web UI | Next.js 14 + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Voice | pynput + sounddevice |

## License

MIT License - Built with ❤️ by Agapitos Kalafatas

Inspired by the incredible work of [@jaredrhod](https://github.com/jaredrhod)
