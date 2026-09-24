# CloseAI — MVP SaaS WhatsApp Sales Assistant

CloseAI is a production-oriented Next.js MVP for an ethical AI sales copilot on WhatsApp. It includes a premium landing page, Supabase authentication architecture, onboarding, dashboard, CRM inbox, products, knowledge base, lead analysis, objection handling, text/audio parity, analytics, subscriptions, settings, and a separately protected platform administration area.

## What works now

- Responsive French product UI across desktop and mobile.
- Signup, login, password reset, email verification and onboarding. When Supabase is not configured, the UI enters an explicit local demo mode; once configured, Supabase Auth is used.
- Modular server-side AI endpoint (`POST /api/ai/respond`) with an OpenAI-compatible adapter and a safe deterministic fallback.
- Commercial analysis: intent, interest, objection, sentiment, urgency, budget mentioned explicitly, 0–100 score, next action, and human handoff.
- Official Meta webhook at `GET/POST /api/whatsapp/webhook`; this is **not a fake WhatsApp implementation**.
- Incoming text → outgoing text.
- Incoming audio → Meta media download → transcription → analysis/generation → TTS → Meta media upload → outgoing audio.
- Incoming images → multimodal analysis with payment-proof safety warning → text response or human handoff.
- Conversation context, messages and analysis persisted to Supabase when configured.
- Copilot/automatic mode is stored per WhatsApp account. In Copilot mode, replies are generated and persisted but not automatically sent.
- Tenant-isolated PostgreSQL schema and Row Level Security.
- Platform admin route protected by both authentication and `users.is_platform_admin`.
- Product and knowledge REST endpoints protected by the user's Supabase bearer token and tenant membership.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without credentials, the UI and safe response generator remain usable in demo mode.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/001_initial_schema.sql`.
3. Copy the project URL, anon key, and service-role key to `.env.local`.
4. Enable email authentication. Configure your production Site URL and redirect URLs.
5. Never expose `SUPABASE_SERVICE_ROLE_KEY` in a browser or prefix it with `NEXT_PUBLIC_`.

The migration creates organization membership, all MVP domain tables, signup provisioning, indexes, vector search support, and RLS policies. Every tenant table is scoped by organization membership.

## Meta WhatsApp Cloud API setup

Required server variables:

- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_WHATSAPP_VERIFY_TOKEN`
- `META_APP_SECRET` (required in production for webhook signature verification)

In Meta Developer Console:

1. Add the WhatsApp product to your Meta app.
2. Set callback URL to `https://YOUR_DOMAIN/api/whatsapp/webhook`.
3. Use the same verify token as `META_WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to the `messages` webhook field.
5. Insert the number's `phone_number_id` in `whatsapp_accounts` for the correct organization.
6. Set account `mode` to `copilot` or `automatic`.

Production recommendation: use a durable job queue and acknowledge Meta webhooks immediately. The MVP processes requests in the route so its end-to-end behavior is easy to understand and deploy.

## AI providers

All AI calls live under `lib/ai`; no secret is exposed to the frontend.

Current adapter capabilities:

- Conversation and structured sales analysis: OpenAI Chat Completions compatible API.
- Audio transcription: OpenAI audio transcription.
- Speech generation: OpenAI speech endpoint, Opus output.
- Image analysis: multimodal chat completion.
- Knowledge: tenant-scoped records and optional pgvector embeddings.

Change `OPENAI_BASE_URL` and model variables for a compatible provider, or add another provider behind the functions in `lib/ai/orchestrator.ts`. If no key is set, the inbox demo uses a safe rule-based fallback; external transcription/TTS/vision correctly remain unavailable.

## Security and commercial safety

- Secrets are server-only.
- Meta webhook signatures are validated with `META_APP_SECRET` in production.
- RLS prevents cross-organization access.
- Admin authorization is separate from organization roles.
- The AI prompt forbids invented prices, promotions, guarantees, identity claims, fabricated evidence, false urgency, and aggressive manipulation.
- Payment screenshots are never accepted as final verification. Use a payment provider webhook or human validation.
- Missing or risky information triggers `requiresHuman`.

## WhatsApp compliance

For production follow-ups outside the customer-service window, send only approved WhatsApp message templates and record consent. The `follow_ups` schema includes `requires_template` and `template_name`; connect a scheduler/queue before enabling automatic follow-ups.

## External integrations still requiring your credentials

1. Supabase project and keys.
2. Meta Business app, permanent system-user token, number IDs, verify token, and app secret.
3. AI/transcription/TTS/vision provider key.
4. Stripe or another payment provider for subscriptions.
5. A transactional email provider only if you choose not to use Supabase Auth email.
6. Object storage and a worker queue are recommended for larger audio/document workloads.

## Main routes

- `/` landing page
- `/signup`, `/login`, `/forgot-password`, `/verify-email`
- `/onboarding`
- `/dashboard`, `/inbox`, `/contacts`, `/products`, `/knowledge`, `/analytics`, `/billing`, `/settings`
- `/admin` platform admin; requires `users.is_platform_admin = true`
- `/api/ai/respond`
- `/api/whatsapp/webhook`
- `/api/health/config`

## Production checklist

- Deploy behind HTTPS.
- Rotate temporary Meta tokens for a permanent system-user token.
- Set `META_APP_SECRET`; unsigned production webhooks are rejected.
- Configure Supabase Auth URLs and SMTP.
- Add rate limits to AI and auth endpoints.
- Move media handling to private object storage with expiring signed URLs.
- Move webhook work to an idempotent queue.
- Add Stripe/payment-provider webhook verification before activating paid plans.
- Add approved Meta templates and consent logging before automated relaunches.
- Add monitoring, audit logs, backups, data retention/deletion jobs, and applicable privacy/legal notices.
