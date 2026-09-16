# AI Freelance Survivor OS

Reference implementation for integrating an AI workforce into an existing CRM.

The package demonstrates the core loop: agent context -> router -> opportunity scoring -> approval -> proposal -> evaluator/verifier boundary -> job/payment simulation -> wallet -> memory -> realtime events.

## Run

```bash
npm install
cp .env.example .env
npm run test
npm run dev
```

Open http://localhost:8787

Without `OPENAI_API_KEY`, the system uses a deterministic mock LLM so the vertical slice runs immediately. With an OpenAI key, the current provider uses the Responses API and built-in web search. OpenAI's current Responses API supports web search and custom function tools, and current model docs list computer use support for flagship models. See official docs referenced in the integration notes.

## What this is

This is a CRM-agnostic reference module. It intentionally does not assume your CRM schema, auth, queue, realtime bus, customer tables, or UI framework. The Prisma schema shows one persistence shape; the `Store` is an in-memory runtime used for the first vertical slice.

## What must be adapted in the existing CRM

- Replace `Store` with your existing database/repositories.
- Map `AiAgent`/`AiOpportunity`/`AiApproval` to existing CRM entities where possible.
- Connect the event publisher to your existing websocket/SSE/event bus.
- Connect authentication and authorization.
- Connect your existing customer/company/job records.
- Add production queue/background workers.
- Add your approved web-search and browser/computer-use integration.
- Add real marketplace adapters only where the platform's API/terms permit.

## Safety boundary

Sandbox mode is the default. High-impact external actions are approval-gated. Do not grant unrestricted access to payment instruments or account credentials.
