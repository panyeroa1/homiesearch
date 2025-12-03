_Eburon – Engineering Ground Rules_

This file defines the **non-negotiables** for anyone touching an Eburon codebase.  
If anything conflicts with this file, **this file wins**.

---

## 1. Scope – Where This Applies

These rules apply to **all** Eburon projects, including but not limited to:

- Web apps (e.g. dashboards, portals, landing pages)
- Backends / APIs / microservices
- Voice / avatar agents and callcenter tooling
- Internal tools, admin panels, and automation scripts

If it carries the Eburon name or uses Eburon infra, treat this document as binding.

---

## 2. Golden Rules

1. **Don’t break core flows**
   - Identify the **core business flows** for the repo you’re touching:
     - e.g. login, checkout, lead intake, dialer call, search, ticket creation, etc.
   - If you touch them:
     - Add or update tests.
     - Manually verify end-to-end behavior before merging.

2. **System prompts are product, not comments**
   - Prompts for agents/avatars (e.g. brokers, HR, CSR, support agents) are part of the UX.
   - Do **not**:
     - “Simplify” them just because they’re long.
     - Add “as an AI” or similar disclaimers unless explicitly required.
     - Remove human-like behavior and local flavor without clear instruction.
   - Any prompt change:
     - Gets its own PR (or clearly separated commit).
     - Includes a before/after diff in the description.
     - Documents **why** the change was made.

3. **No secret leakage**
   - All credentials (API keys, auth tokens, DB URLs, etc.):
     - Live only in environment variables or secret stores.
     - Are **never** hard-coded in source or documentation.
   - If you accidentally commit a secret:
     - Rotate it immediately.
     - Inform the team.
     - Clean up the history as needed.

4. **Human-first behavior**
   - Eburon agents and apps should feel human-centric and trustworthy.
   - A **fast but wrong** response is worse than a **slower but correct** one.
   - UX changes should preserve clarity, politeness, and user control (e.g. confirmations for destructive actions).

5. **Small, reversible changes**
   - Prefer small feature branches and focused PRs.
   - Avoid unrelated “drive-by refactors” in critical areas.
   - Keep changes easy to understand and roll back.

---

## 3. Branching & PR Discipline

- `main` (or `production`) must always be **deployable**.
- All work happens in branches, e.g.:
  - `feature/<short-description>`
  - `fix/<bug-description>`
  - `chore/<infra-or-upgrade>`

**PR checklist (self-check before asking for review):**

- [ ] Plain-language description of the change and its impact.
- [ ] List of **user-visible** flows you tested.
- [ ] New env vars added to `.env.example` with safe placeholders.
- [ ] Screenshots / short notes for UI changes.
- [ ] All tests pass locally (and in CI, if configured).
- [ ] No obvious console errors or failing network calls in critical screens.

---

## 4. Environments, Secrets & “EBURON_PRO” Base64 Aliases

> This section is **mandatory** for any third-party API / model integration.

### 4.1. Standard Env Handling

- Use `.env.local`, `.env.development`, `.env.production`, etc. as appropriate.
- All configuration must come from env vars for:
  - API keys
  - Base URLs
  - Model IDs/names
  - DB connection info
  - Auth secrets / JWT signing keys
- **Never** hard-code:
  - Keys
  - Tokens
  - Provider URLs
  - Sensitive IDs

Always mirror new env vars in `.env.example` with **dummy** values.

---

### 4.2. Base64 Aliases Using the “EBURON_PRO” Pattern

For *every* 3rd-party API key, base URL, and model name, Eburon uses the following pattern:

> Raw provider values stay private; code and prompts use **Base64-encoded Eburon aliases**.

#### 4.2.1. Naming Convention (Required)

Do **not** use generic “ALIAS” names like:

```env
# ❌ NOT ALLOWED
# EBURON_ALIAS_GEMINI_API_KEY=...
# EBURON_ALIAS_GEMINI_BASE_URL=...
# EBURON_ALIAS_GEMINI_MODEL_NAME=...
```

Instead, you **must** use the `EBURON_PRO` pattern with numbered slots:

```env
# RAW PROVIDER VALUES (backend-only)
GEMINI_API_KEY=real_gemini_key_here
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL_NAME=gemini-2.0-pro

# EBURON-FACING BASE64 ALIASES
EBURON_PRO1_API_KEY=ZWJ1cm9uLXBybzpnZW1pbmk=
EBURON_PRO1_BASE_URL=aHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20=
EBURON_PRO_MODEL1=Z2VtaW5pLTItMC1wcm8=
```

Rules:

* `EBURON_PRO1_API_KEY` – Base64 alias for the first “Pro” slot API key.
* `EBURON_PRO1_BASE_URL` – Base64 alias for the first “Pro” slot base URL.
* `EBURON_PRO_MODEL1` – Base64 alias for the first model tied to that slot.

If you need more providers/models:

```env
# Second provider / slot
OTHER_API_KEY=real_other_key
OTHER_BASE_URL=https://api.other.com
OTHER_MODEL_NAME=other-model-v1

EBURON_PRO2_API_KEY=YmFzZTY0X29mX290aGVyX2tleQ==
EBURON_PRO2_BASE_URL=aHR0cHM6Ly9hcGkub3RoZXIuY29t
EBURON_PRO_MODEL2=b3RoZXItbW9kZWwtdjE=
```

* Increment `PRO1`, `PRO2`, `PRO3`, … for additional “slots”.
* Increment `EBURON_PRO_MODEL1`, `EBURON_PRO_MODEL2`, … for multiple models.

#### 4.2.2. How Code Should Use These

* **Backend services**:

  * Use raw envs (`*_API_KEY`, `*_BASE_URL`, `*_MODEL_NAME`) to talk to the provider.
  * Use `EBURON_PRO*_API_KEY`, `EBURON_PRO*_BASE_URL`, `EBURON_PRO_MODEL*`:

    * As internal labels / routing IDs.
    * In logs (when needed and safe).
    * When sending non-sensitive “engine labels” to the frontend.

* **Frontend apps**:

  * Must never see raw provider names/URLs/keys.
  * If a front-end needs to know “which engine/model is in use,” it should only see:

    * `EBURON_PRO_MODEL1`, `EBURON_PRO_MODEL2`, etc.
  * User-facing copy should reference Eburon-branded names (e.g. *“Eburon-Pro Model 1”*), not provider brand names.

#### 4.2.3. Adding a New Provider / Model

When introducing any new external API or model:

1. Add backend-only envs:

   * `<PROVIDER>_API_KEY`
   * `<PROVIDER>_BASE_URL`
   * `<PROVIDER>_MODEL_NAME` (if applicable)
2. Add aliased envs:

   * `EBURON_PRO{N}_API_KEY`
   * `EBURON_PRO{N}_BASE_URL`
   * `EBURON_PRO_MODEL{M}`
3. Use **only** `EBURON_PRO*` aliases in:

   * Prompts / system messages
   * Routing UI (model pickers, engine selectors)
   * Logs / telemetry where IDs are needed
4. Update `.env.example` and, if it’s a core integration, add a short note in the project README.

---

## 5. Core Flow Declaration (Per Repo)

Each Eburon repo **must declare its own core flows** in a local section inside this file (or a sibling file referenced here).

Example template (to be filled per project):

```markdown
## 5.x. Core Flows for <PROJECT_NAME>

- Flow A: <short description – e.g. user login / sign-up>
- Flow B: <short description – e.g. lead submission>
- Flow C: <short description – e.g. outbound call initiation>
- Flow D: <short description – e.g. payment / subscription>

Rules:
- Any change touching these flows requires:
  - Updated tests (unit + integration where applicable).
  - Manual end-to-end test runs.
  - Clear mention in the PR description.
```

If your repo doesn’t have this section yet: **add it** before merging larger changes.

---

## 6. Voice, Avatars & Agents

Eburon works with multiple agent personas (voice or avatar). These are:

* Region and domain specific (e.g. HR, real estate, support)
* Designed to sound human and trustworthy
* Often used in demos and real customer interactions

### 6.1. Prompt & Persona Discipline

* System prompts are **not** a playground.
* If you adjust:

  * Persona tone
  * Allowed actions
  * Safety/ethics rules
  * Language mix (e.g. English + Tagalog / Dutch-Flemish)
* …you must:

  * Explain why in the PR.
  * Verify that the new behavior still matches brand expectations (human, respectful, local).

### 6.2. Provider Integration

* Always use the `EBURON_PRO*` pattern for:

  * Voice model IDs
  * Avatar/agent IDs
  * STT / TTS / LLM engines

For any agent/voice/video integration:

* Ask for mic/camera access in a way that respects browser policies.
* Avoid auto-playing audio/video in a way that breaks or annoys users.
* Ensure fallback behavior (e.g. no mic → show clear error / guidance).

---

## 7. Data, Privacy & Logging

* Logs can include:

  * Request IDs, durations, general status.
  * High-level info about which Eburon “slot” was used (`EBURON_PRO_MODEL1`, etc.).
* Logs must **not** include:

  * Raw API keys, tokens, or base URLs.
  * Raw provider model names (use aliases).
  * Sensitive PII (phones, emails, addresses, payment info), except:

    * Very short-term, targeted debugging, which must then be removed and sanitized.

If deeper debugging is needed:

* Introduce temporary, clearly marked logs.
* Remove them once the issue is resolved.

---

## 8. New Developer Onboarding Checklist

Before pushing your first change to any Eburon repo:

1. Read this `IMPORTANT.md` fully.
2. Ask where the **core flows** are documented for that repo and read them.
3. Set up `.env.local` (or environment-specific env file) from `.env.example`.
4. Run the project locally:

   * Start backend services (if applicable).
   * Start frontend app(s).
5. Exercise the core flows manually:

   * e.g. login, main CRUD operations, primary agent/voice flow, critical dashboards.
6. Locate system prompts or configuration for at least one agent (if the repo uses agents) and read them to understand the tone and constraints.

Only then start implementing features or fixes.

---

## 9. When You’re Unsure

If a change might impact:

* A core business flow
* A live / demo-critical behavior
* System prompts or agent personas
* Any 3rd-party integration using `EBURON_PRO*` aliases

Do this:

1. Write down the risk and your proposal in the issue or PR description.
2. Keep the change as **small and reversible** as possible.
3. Prefer multiple small PRs over one giant one.
4. If in doubt, escalate early rather than silently guessing.

The goal is simple: **Eburon projects must remain stable, demo-ready, and human-first, while hiding provider complexity behind clean, Eburon-branded, Base64-aliased interfaces.**
