# NexusNotify

## Project Overview
NexusNotify is an AI-powered WhatsApp message notification router that classifies each incoming message as `notify`, `digest`, or `mute` using text, image, voice, history, business relationships, group context, and user behavior.

## Architecture
Controller -> Module -> Shared utility flow is used throughout the backend. The dataset module loads CSV files once, builds lookup registries, the context module builds a structured message view, media extraction resolves OCR and transcription, the intent and personalization engines derive supporting signals, the scoring layer computes weighted scores, the decision matrix combines them, and the router/evaluation layer writes `output.csv`.

## Folder Structure
- `backend/src/controllers`
- `backend/src/routes`
- `backend/src/modules`
- `backend/src/shared`
- `backend/src/dataset`

## Installation
1. Install Node.js 22.
2. Change into `backend`.
3. Run `npm install`.

## Environment Variables
- `PORT`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_VISION_MODEL`
- `GEMINI_AUDIO_MODEL`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_BASE_URL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_HTTP_REFERER`
- `OPENROUTER_APP_NAME`
- `LLM_TIMEOUT_MS`
- `DEBUG`

## Run Locally
1. `Set-Location 'D:\Major Project\NexusNotify\backend'`
2. `npm run build`
3. `npm start`

## Run Docker
1. From the repository root, run `docker compose up --build`.
2. The backend runs on port `5000`.

## API List
- `GET /api/health`
- `GET /api/dataset/stats`
- `GET /api/context/:messageId`
- `GET /api/scoring/:messageId`
- `GET /api/evidence/:messageId`
- `GET /api/media/:messageId`
- `GET /api/intent/:messageId`
- `GET /api/personalization/:messageId`
- `GET /api/decision/:messageId`
- `GET /api/messages/:messageId/route`
- `POST /api/submission/generate`

## Dataset Information
The backend reads the CSV files in `backend/src/dataset`. These files are treated as read-only inputs. The generated submission is written to `backend/src/dataset/output.csv`.

## How output.csv is generated
On startup, the backend loads the dataset, builds registry maps, resolves context and media for each message, scores the message, applies the decision matrix, optionally calls the LLM fallback when rule confidence is low, and writes the final rows to `output.csv` with the required schema.
