# PipeChat Voice Agent

A real-time AI voice agent application combining a **TypeScript Frontend** (Next.js) and a **Python Backend** (FastAPI + Pipecat), following the "Better T-Stack" philosophy with end-to-end type safety.

Created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

## Overview

PipeChat Voice Agent is a production-ready voice AI application that enables real-time conversational interactions using:
- **Pipecat AI** framework for voice agent orchestration
- **Daily.co WebRTC** for real-time audio streaming
- **OpenAI-compatible APIs** for LLM, Speech-to-Text (STT), and Text-to-Speech (TTS)
- **End-to-end type safety** between frontend and backend via OpenAPI

## Features

- 🎙️ **Real-time Voice Conversations** - Low-latency voice interactions via WebRTC
- 🤖 **AI-Powered Bot** - Built with Pipecat AI framework
- 🔒 **Type Safety** - Full type safety across frontend and backend
- 🚀 **Next.js 16.0.0** - Modern full-stack React framework
- ⚡ **FastAPI** - High-performance Python backend
- 🎨 **TailwindCSS 4.1.10** - Utility-first styling
- 📡 **TanStack Query 5.85.5** - Powerful data fetching
- 📦 **Turborepo** - Optimized monorepo build system
- 🔧 **OpenAPI** - Automatic TypeScript client generation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm 11+
- **Python** 3.10 or higher
- **uv** - Fast Python package installer ([installation guide](https://github.com/astral-sh/uv))
- **Daily.co account** (optional) - For WebRTC voice capabilities ([sign up](https://daily.co))

## Project Structure

```
pipechat-voice-agent/
├── apps/
│   ├── api/                   # Python Backend (FastAPI)
│   │   ├── main.py            # FastAPI entry point
│   │   ├── bot.py             # Pipecat voice agent implementation
│   │   ├── custom_tts.py      # Custom TTS processor
│   │   ├── export_openapi_minimal.py
│   │   ├── openapi.json       # Generated OpenAPI schema
│   │   ├── env.example        # Environment variables template
│   │   ├── pyproject.toml     # Python dependencies
│   │   └── Dockerfile         # Container configuration
│   └── web/                   # TypeScript Frontend (Next.js)
│       ├── src/
│       │   ├── app/
│       │   │   └── page.tsx   # Main page
│       │   ├── components/    # React components
│       │   └── lib/
│       │       └── api-client/ # Generated TypeScript client
│       ├── .env.example       # Frontend environment template
│       ├── openapi-ts.config.ts
│       └── package.json
├── docs/                      # Documentation
├── packages/                  # Shared packages
├── turbo.json                 # Turborepo configuration
└── package.json               # Root package configuration
```

## Getting Started

### 1. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd apps/api
uv sync
```

> [!NOTE]
> If `uv sync` fails due to disk space issues, free up space and try again. The command creates a virtual environment and installs all Python dependencies.

### 2. Environment Configuration

#### Backend Environment Setup

Copy the example environment file and configure your API keys:

```bash
cd apps/api
cp env.example .env
```

Edit `.env` with your configuration:

```bash
# LLM Configuration (OpenAI-compatible endpoint)
LLM_BASE_URL="http://your-llm-server:8886/v1"
LLM_MODEL="your-model-name"
LLM_API_KEY="sk-your-api-key"

# Speech-to-Text (STT) Configuration
STT_BASE_URL="http://your-stt-server:8882/v1"
STT_API_KEY="sk-your-api-key"
STT_MODEL="small"
STT_RESPONSE_FORMAT="verbose_json"
LANGUAGE="en"

# Text-to-Speech (TTS) Configuration
TTS_BASE_URL="http://your-tts-server:8884/v1"
TTS_API_KEY="your-api-key"
TTS_MODEL="kokoro"
TTS_VOICE="af_heart"
TTS_BACKEND="kokoro"
TTS_AUDIO_FORMAT="pcm"

# Daily.co WebRTC (Optional for local testing)
DAILY_API_KEY=your_daily_api_key
```

> [!IMPORTANT]
> This application uses **OpenAI-compatible API endpoints** for LLM, STT, and TTS. You can use:
> - OpenAI's official APIs
> - Self-hosted models (e.g., vLLM, FastWhisper, etc.)
> - Other OpenAI-compatible services

#### Frontend Environment Setup

```bash
cd apps/web
cp .env.example .env
```

Edit `.env`:

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
```

### 3. Start Development Servers

#### Backend (FastAPI)
```bash
cd apps/api
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **API Base**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

#### Frontend (Next.js)
From the **root directory**:
```bash
npm run dev
```

The web app will be available at `http://localhost:3001`

## Type-Safe API Integration

This project uses OpenAPI to maintain end-to-end type safety between the Python backend and TypeScript frontend.

### Workflow for Adding New Endpoints

1. **Add endpoint to `apps/api/main.py`**
   ```python
   @app.get("/api/users")
   async def get_users():
       return [{"id": 1, "name": "Alice"}]
   ```

2. **Regenerate OpenAPI schema**
   ```bash
   cd apps/api
   python3 export_openapi_minimal.py
   ```

3. **Regenerate TypeScript client**
   ```bash
   cd apps/web
   npm run generate-client
   ```

4. **Use in frontend with full type safety**
   ```typescript
   import { client } from '@/lib/api-client';
   
   const { data } = useQuery({
     queryKey: ['users'],
     queryFn: async () => {
       const response = await client.GET('/api/users');
       return response.data; // Fully typed!
     },
   });
   ```

## Available Scripts

### Root Level
- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications
- `npm run dev:web` - Start only the web application

### Frontend (`apps/web`)
- `npm run dev` - Start Next.js dev server (port 3001)
- `npm run build` - Build for production
- `npm run generate-client` - Generate TypeScript client from OpenAPI schema

### Backend (`apps/api`)
- `uvicorn main:app --reload --port 8000` - Start FastAPI dev server
- `python3 export_openapi_minimal.py` - Generate OpenAPI schema

## Pipecat Voice Agent Integration

### Architecture

The voice agent is built using:
- **Pipecat AI**: Framework for building real-time voice agents
- **Daily.co WebRTC**: Real-time audio transport layer
- **RTVI Protocol**: Real-Time Voice and Video Inference standard

### Current Implementation

The `bot.py` file contains a fully functional Pipecat voice agent with:
- OpenAI-compatible LLM integration
- OpenAI-compatible STT (Speech-to-Text)
- OpenAI-compatible TTS (Text-to-Speech)
- Daily.co WebRTC transport
- Custom TTS timing processor (`custom_tts.py`)

### Running the Voice Bot

To run the bot standalone (requires configured `.env` file):
```bash
cd apps/api
uv run bot.py
```

The bot will create a Daily.co room or WebRTC connection that you can join from your browser.

Future FastAPI integration will include:

1. **FastAPI endpoints** for bot lifecycle management:
   - `POST /api/bot/start` - Start a new bot session
   - `POST /api/bot/stop` - Stop an active session
   - `GET /api/bot/status` - Check bot status

2. **Daily.co room management**:
   - Create temporary Daily rooms for each session
   - Manage WebRTC connections
   - Handle bot join/leave events

3. **Frontend integration**:
   - Daily.co React components for audio streaming
   - Real-time connection status
   - Voice activity indicators

## Troubleshooting

### Common Issues

#### `uv sync` fails with disk space error
```bash
# Check available disk space
df -h

# Clean up unnecessary files
# Then retry: uv sync
```

#### Port already in use
```bash
# Backend (8000)
lsof -ti:8000 | xargs kill -9

# Frontend (3001)
lsof -ti:3001 | xargs kill -9
```

#### Missing API keys
Ensure all required environment variables are set in `apps/api/.env`. The bot won't start without valid API keys.

#### CORS errors in frontend
Check that `NEXT_PUBLIC_SERVER_URL` in `apps/web/.env` matches your backend URL.

#### TypeScript client out of sync
Regenerate the client after backend changes:
```bash
# From root directory
cd apps/api
python3 export_openapi_minimal.py
cd ../web
npm run generate-client
```

## Production Deployment

> [!WARNING]
> Before deploying to production, complete these critical steps:

### Security
- ✅ Update CORS configuration in `main.py` to specify allowed origins (currently set to `*`)
- ✅ Use environment variables for all API keys (never commit them!)
- ✅ Enable HTTPS for all endpoints
- ✅ Implement authentication and authorization

### Infrastructure
- ✅ Set up a Daily.co production account
- ✅ Configure rate limiting for API endpoints
- ✅ Set up monitoring and logging
- ✅ Use a production-grade ASGI server (e.g., Gunicorn with Uvicorn workers)

### Environment Variables
- ✅ Secure all API keys in your deployment platform's secret management
- ✅ Configure production LLM/STT/TTS endpoints
- ✅ Set up proper error tracking (e.g., Sentry)

## Technology Stack

### Frontend
- Next.js 16.0.0
- React 19.2.0
- TailwindCSS 4.1.10
- TanStack Query 5.85.5
- TypeScript 5

### Backend
- FastAPI 0.110.0+
- Python 3.10+
- Pipecat AI (supports OpenAI-compatible endpoints for LLM/STT/TTS)
- uvicorn 0.27.0+ (ASGI server)

### Type Safety
- OpenAPI 3.1.0
- @hey-api/openapi-ts 0.88.0
- Automatic client generation

### Infrastructure
- Turborepo 2.5.4
- uv (Python package manager)
- Daily.co (WebRTC transport)

## Contributing

Contributions are welcome! Please ensure:
1. Type safety is maintained across backend and frontend
2. OpenAPI schema is regenerated after backend changes
3. Tests pass before submitting PRs

## License

See [LICENSE](LICENSE) file for details.
