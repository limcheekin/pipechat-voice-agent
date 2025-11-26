# PipeChat Voice Agent - Implementation Plan

## Overview

This document outlines the implementation plan for PipeChat Voice Agent, a real-time AI voice conversation application built using a modern monorepo architecture with TypeScript frontend and Python backend.

## Project Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Monorepo** | Turborepo | Build orchestration and caching |
| **Frontend** | Next.js 16.0.0 + React 19.2.0 | Web application |
| **Backend** | FastAPI + Pipecat AI | Voice agent orchestration |
| **Transport** | Daily.co / WebRTC | Real-time audio streaming |
| **Protocols** | RTVI (Real-Time Voice Inference) | Voice agent communication |
| **Type Safety** | OpenAPI 3.1.0 | End-to-end type safety |
| **Styling** | TailwindCSS 4.1.10 | UI framework |
| **Data Fetching** | TanStack Query 5.85.5 | Server state management |

### Current Project Structure

```
pipechat-voice-agent/
├── apps/
│   ├── api/                              # Python Backend
│   │   ├── bot.py                        # Pipecat voice agent
│   │   ├── custom_tts.py                 # Custom TTS processor
│   │   ├── main.py                       # FastAPI entry point
│   │   ├── export_openapi.py             # Full OpenAPI export (includes all metadata)
│   │   ├── export_openapi_minimal.py     # Minimal OpenAPI export (recommended, cleaner output)
│   │   ├── openapi.json                  # Generated API schema
│   │   ├── .env                          # Backend configuration
│   │   ├── env.example                   # Environment template
│   │   ├── pyproject.toml                # Python dependencies
│   │   ├── uv.lock                       # Locked dependencies
│   │   └── Dockerfile                    # Container configuration
│   │
│   └── web/                              # TypeScript Frontend
│       ├── src/
│       │   ├── app/                      # Next.js App Router
│       │   │   ├── page.tsx              # Main application page
│       │   │   ├── layout.tsx            # Root layout
│       │   │   └── globals.css           # Global styles
│       │   ├── components/               # React components
│       │   ├── lib/
│       │   │   └── api-client/           # Generated TypeScript client
│       │   └── index.css                 # Design system styles
│       ├── .env                          # Frontend configuration
│       ├── .env.example                  # Environment template
│       ├── openapi-ts.config.ts          # Client generation config
│       ├── next.config.ts                # Next.js configuration
│       ├── package.json                  # Frontend dependencies
│       └── tsconfig.json                 # TypeScript configuration
│
├── packages/
│   └── config/                           # Shared configuration
│
├── docs/
│   └── implementation-plan.md            # This document
│
├── package.json                          # Root package.json
├── turbo.json                            # Turborepo configuration
├── bts.jsonc                             # Better-T-Stack metadata
└── README.md                             # Project documentation
```

---

## Component Architecture

### Backend Components (`apps/api/`)

#### 1. Voice Agent (`bot.py`)

**Purpose**: Core Pipecat voice agent implementation with OpenAI-compatible services

**Current Features**:
- OpenAI-compatible STT (Speech-to-Text) service
- OpenAI-compatible LLM (Language Model) service  
- Custom TTS (Text-to-Speech) with timing support
- Daily.co/WebRTC transport layer
- RTVI protocol support
- Smart turn detection (LocalSmartTurnAnalyzerV3)
- Voice Activity Detection (Silero VAD)

**Pipeline Architecture**:
```
User Audio → Transport Input → RTVI → STT → Context Aggregator (User) 
→ LLM → Custom TTS → Transport Output → Context Aggregator (Assistant)
```

**Transport Options**:
- `daily`: Daily.co WebRTC transport (production-ready)
- `webrtc`: Generic WebRTC transport (local development)

**Running the Bot**:
```bash
cd apps/api
uv run bot.py                    # Uses default Daily transport
uv run bot.py --transport daily  # Explicit Daily transport
uv run bot.py --transport webrtc # WebRTC transport
```

#### 2. Custom TTS Processor (`custom_tts.py`)

**Purpose**: Extended OpenAI-compatible TTS service with custom features

**Features**:
- Supports Kokoro TTS backend
- PCM audio format support
- Integration with Pipecat pipeline
- Configurable via environment variables

**Configuration** (`.env`):
```bash
TTS_BASE_URL=http://your-tts-server:8884/v1
TTS_API_KEY=your-api-key
TTS_MODEL=kokoro
TTS_VOICE=af_heart
TTS_BACKEND=kokoro
TTS_AUDIO_FORMAT=pcm
```

#### 3. FastAPI Server (`main.py`)

**Purpose**: REST API server for bot management and health checks

**Current Endpoints**:
- `GET /` - Root endpoint (welcome message)
- `GET /health` - Health check endpoint
- `POST /api/bot/start` - Bot lifecycle endpoint (placeholder, not implemented)

**Future Endpoints** (planned):
- `POST /api/bot/stop` - Stop bot session
- `GET /api/bot/status` - Get bot status

**CORS Configuration**:
- Currently allows all origins (`*`)
- **Production TODO**: Restrict to specific frontend domains

#### 4. OpenAPI Schema Generation

**Files**:
- `export_openapi.py` - Full OpenAPI export (includes all metadata)
- `export_openapi_minimal.py` - Minimal export (recommended, cleaner output)
- `openapi.json` - Generated OpenAPI 3.1.0 schema

**Usage**:
```bash
cd apps/api
python3 export_openapi_minimal.py  # Recommended
# OR
python3 export_openapi.py          # Full export
```

**Type Safety Flow**:
1. Define endpoints in `main.py` with FastAPI + Pydantic
2. Generate OpenAPI schema with `export_openapi_minimal.py`
3. Frontend auto-generates TypeScript client
4. Full end-to-end type safety

---

### Frontend Components (`apps/web/`)

#### 1. Next.js Application

**Framework**: Next.js 16.0.0 with App Router

**Key Files**:
- `src/app/page.tsx` - Main application page
- `src/app/layout.tsx` - Root layout with metadata (imports from `../index.css`)
- `src/index.css` - Design system and utility classes (TailwindCSS)

**Configuration**: 
- TypeScript 5 with strict mode
- TailwindCSS 4.1.10 for styling
- shadcn/ui components (via `components.json`)
- Geist & Geist Mono fonts from `next/font/google`

#### 2. Generated API Client

**Location**: `src/lib/api-client/`

**Generation**:
```bash
cd apps/web
npm run generate-client
```

**Usage Example**:
```typescript
import { client } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export function HealthCheck() {
  const { data } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await client.GET('/health');
      return response.data; // Fully typed!
    },
  });
  
  return <div>{data?.status}</div>;
}
```

#### 3. Component Library

**Location**: `src/components/`

**Setup**: shadcn/ui components
- Radix UI primitives
- TailwindCSS styling
- Fully customizable

**Add Components**:
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
```

---

## Environment Configuration

### Backend Environment (`apps/api/.env`)

```bash
# LLM Configuration (OpenAI-compatible)
LLM_BASE_URL=http://your-llm-server:8886/v1
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=sk-your-api-key

# Speech-to-Text Configuration
STT_BASE_URL=http://your-stt-server:8882/v1
STT_API_KEY=sk-your-api-key
STT_MODEL=small
STT_RESPONSE_FORMAT=verbose_json
LANGUAGE=en

# Text-to-Speech Configuration
TTS_BASE_URL=http://your-tts-server:8884/v1
TTS_API_KEY=your-api-key
TTS_MODEL=kokoro
TTS_VOICE=af_heart
TTS_BACKEND=kokoro
TTS_AUDIO_FORMAT=pcm

# Daily.co WebRTC (Optional)
DAILY_API_KEY=your_daily_api_key
```

### Frontend Environment (`apps/web/.env`)

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
```

---

## Development Workflow

### 1. Initial Setup

```bash
# Install all dependencies
npm install

# Install backend dependencies
cd apps/api
uv sync

# Copy environment files
cp apps/api/env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Configure your API keys in .env files
```

### 2. Start Development

**Option 1: Start All Services** (using Turborepo)
```bash
npm run dev
```

**Option 2: Start Individually**

Terminal 1 - Backend:
```bash
cd apps/api
uvicorn main:app --reload --port 8000
```

Terminal 2 - Voice Bot:
```bash
cd apps/api
uv run bot.py
```

Terminal 3 - Frontend:
```bash
npm run dev:web
```

### 3. Type-Safe API Development

**Add New Backend Endpoint**:
```python
# apps/api/main.py
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str

@app.get("/api/users", response_model=list[User])
async def get_users():
    return [{"id": 1, "name": "Alice"}]
```

**Regenerate Types**:
```bash
# Generate OpenAPI schema
cd apps/api
python3 export_openapi_minimal.py

# Generate TypeScript client
cd ../web
npm run generate-client
```

**Use in Frontend**:
```typescript
import { client } from '@/lib/api-client';

const { data } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await client.GET('/api/users');
    return response.data; // Type: User[] | undefined
  },
});
```

---

## Future Enhancements

### Phase 1: Basic Integration (Current State) ✅
- [x] Monorepo setup with Turborepo
- [x] TypeScript frontend with Next.js 16
- [x] Python backend with FastAPI
- [x] Pipecat voice agent with Daily.co transport
- [x] OpenAI-compatible STT/LLM/TTS integration
- [x] End-to-end type safety via OpenAPI
- [x] Custom TTS processor

### Phase 2: Frontend Voice Integration (Planned)
- [ ] Daily.co React components integration
- [ ] Real-time audio streaming UI
- [ ] Voice activity indicators
- [ ] Connection status management
- [ ] Bot session lifecycle management via API

### Phase 3: Advanced Features (Future)
- [ ] LiveKit transport support
- [ ] 3D avatar integration (TalkingHead.js)
- [ ] Lip-sync with word-level timing
- [ ] Multimodal support (vision + voice)
- [ ] Camera input for visual LLM processing
- [ ] Advanced analytics and metrics

### Phase 4: Production Readiness
- [ ] Authentication & authorization
- [ ] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] Monitoring & logging
- [ ] Docker deployment
- [ ] CI/CD pipeline
- [ ] Production CORS configuration
- [ ] API key rotation
- [ ] Database integration (if needed)

---

## Build & Deployment

### Development Build

```bash
# Build all packages
npm run build

# Build specific app
turbo -F web build
turbo -F api build  # Note: API doesn't have build step currently
```

### Production Considerations

#### Security Checklist
- [ ] Update CORS configuration in `main.py` (remove `allow_origins=["*"]`)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS for all endpoints
- [ ] Implement authentication/authorization
- [ ] Secure Daily.co API keys
- [ ] Add rate limiting to API endpoints

#### Infrastructure
- [ ] Set up production Daily.co account
- [ ] Configure production LLM/STT/TTS endpoints
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure logging and monitoring
- [ ] Use production ASGI server (Gunicorn + Uvicorn workers)
- [ ] Set up CDN for Next.js static assets
- [ ] Configure database (if needed)

#### Deployment Options

**Backend**:
- Docker container (Dockerfile provided)
- Railway, Render, or AWS EC2
- Pipecat Cloud (for bot.py deployment)

**Frontend**:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Self-hosted with Docker

---

## Testing Strategy

### Backend Testing
```bash
cd apps/api

# Run tests (when implemented)
pytest

# Type checking
mypy .

# Linting
ruff check .
```

### Frontend Testing
```bash
cd apps/web

# Type checking (using TypeScript directly)
tsc --noEmit

# Build test (includes type checking)
npm run build
```

### Integration Testing
- [ ] Test OpenAPI schema generation
- [ ] Verify TypeScript client generation
- [ ] Test API endpoints with generated client
- [ ] Test voice agent with real audio
- [ ] Test Daily.co room connection

---

## Troubleshooting

### Common Issues

**1. `uv sync` fails**
```bash
# Check disk space
df -h

# Clear UV cache
rm -rf ~/.cache/uv

# Try again
uv sync
```

**2. Port conflicts**
```bash
# Kill processes on ports
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:3001 | xargs kill -9  # Frontend
```

**3. Type generation fails**
```bash
# Ensure OpenAPI schema is valid
cd apps/api
python3 export_openapi_minimal.py

# Check for JSON syntax errors
cat openapi.json | jq .

# Regenerate client
cd ../web
npm run generate-client
```

**4. Voice bot fails to start**
- Verify all API keys in `apps/api/.env`
- Check STT/LLM/TTS endpoint availability
- Verify Daily.co API key (if using Daily transport)
- Check network connectivity to AI service endpoints

**5. Frontend can't connect to backend**
- Verify `NEXT_PUBLIC_SERVER_URL` in `apps/web/.env`
- Check CORS configuration in `main.py`
- Ensure backend is running on port 8000

---

## Resources

### Documentation
- [Pipecat Documentation](https://docs.pipecat.ai)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Daily.co Documentation](https://docs.daily.co)
- [TanStack Query](https://tanstack.com/query/latest)

### Project Files
- [README.md](file:///media/limcheekin/My%20Passport/ws/py/pipechat-voice-agent/README.md) - Main project documentation
- [bot.py](file:///media/limcheekin/My%20Passport/ws/py/pipechat-voice-agent/apps/api/bot.py) - Voice agent implementation
- [main.py](file:///media/limcheekin/My%20Passport/ws/py/pipechat-voice-agent/apps/api/main.py) - FastAPI server
- [custom_tts.py](file:///media/limcheekin/My%20Passport/ws/py/pipechat-voice-agent/apps/api/custom_tts.py) - Custom TTS processor

### Community
- [Pipecat Discord](https://discord.gg/pipecat)
- [Better-T-Stack GitHub](https://github.com/AmanVarshney01/create-better-t-stack)
