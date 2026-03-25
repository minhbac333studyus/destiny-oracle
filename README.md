# Destiny Oracle — Frontend

> Angular 17 SPA — Personal growth tracker with a Pokemon card / tarot oracle theme.
> Users define "life aspects" (health, career, finances, etc.), confront their fears, dream big,
> and watch their card evolve through 6 stages over 365 days of daily habits.

---

## What Is This App?

Destiny Oracle turns self-improvement into a collectible card game.

1. **You name a life aspect** (e.g., "Health", "Finances")
2. **You answer 3 fear questions + 1 dream question**
3. **The backend (AI) generates a unique card** — title, lore, image, and 3 daily habits
4. **You check in daily** — each check-in fills your stage progress bar
5. **Cards evolve** through 6 stages: Storm → Fog → Clearing → Aura → Radiance → Legend (365 days)
6. **At Stage Legend**, the Reflection Chamber unlocks — the final milestone

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17 (standalone components, no NgModules) |
| State | Angular Signals + local `Store` classes (no NgRx) |
| HTTP | Angular `HttpClient` via `ApiService` |
| Styles | SCSS with global design tokens (`_tokens.scss`) |
| Auth | Email-only login, `userId` stored in `localStorage` |
| Build | Angular CLI 17, proxy to backend on port 8080 |

---

## Running Locally

```bash
cd destiny-oracle
npm install
ng serve          # http://localhost:4200  (proxies /api and /generated to :8080)
```

Backend must be running on `http://localhost:8080` (see `proxy.conf.json`).

```bash
ng build          # production build → dist/
ng test           # unit tests via Karma
```

---

## Authentication Flow

- **No passwords.** Login is email-only — backend creates or finds the user and returns an `AppUser`.
- `AuthService` stores the user in `localStorage` under the key `destiny_user`.
- Every API request sends `X-User-Id: <userId>` header — no JWT tokens.
- Two route guards protect all pages:
  - `authGuard` — redirects to `/login` if not logged in
  - `onboardingCompleteGuard` — redirects to `/onboarding` if user hasn't completed onboarding

### AppUser shape
```ts
{
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  chibiUrl: string | null           // AI-generated chibi avatar
  onboardingComplete: boolean
  joinedAt: Date | string
  timezone?: string
  notificationsEnabled?: boolean
}
```

---

## Onboarding Flow

Route: `/onboarding`

Three steps rendered inside `OnboardingShellComponent`:

| Step | Component | What happens |
|---|---|---|
| `welcome` | `WelcomeStepComponent` | Intro screen, user clicks "Begin" |
| `questions` | `QuestionsStepComponent` | 3 fear questions + 1 dream question |
| `card-reveal` | `CardRevealStepComponent` | Backend creates card + generates images, card is revealed |

`OnboardingStore` (local signal store) holds the step and form data:
```ts
{
  aspectLabel: string   // e.g. "Health & Body"
  fear1: string         // What is most uncertain about your feeling
  fear2: string         // What is the worst case in the future
  fear3: string         // What you can do or try now
  dream: string         // What is the best case
}
```

On completion → `AuthService.completeOnboarding()` sets `onboardingComplete: true` locally and PUTs to the backend.

---

## Card Stages

Cards evolve through 6 stages. Stage is determined by the backend based on check-in history.

| Stage | Color | Approximate timeline |
|---|---|---|
| Storm | `#6366f1` (indigo) | Day 1–30 |
| Fog | `#818cf8` (soft indigo) | Day 31–90 |
| Clearing | `#5ecfff` (sky blue) | Day 91–180 |
| Aura | `#a855f7` (purple) | Day 181–270 |
| Radiance | `#ffb347` (gold) | Day 271–364 |
| Legend | `#f472b6` (pink) | Day 365 |

Stage assets live in `src/assets/` — one PNG per stage name (e.g., `storm.png`, `fog.png`).

---

## Routes

```
/login                    → LoginPageComponent
/onboarding               → OnboardingShellComponent  [authGuard]
/spread                   → SpreadPageComponent        [authGuard + onboardingCompleteGuard]
/card/:cardId             → CardDetailPageComponent
/card/:cardId/evolved     → CardEvolvedPageComponent
/card/:cardId/edit-dream  → EditDreamPageComponent
/checkin                  → DailyCheckinPageComponent
/add-aspect               → AddAspectPageComponent
/profile                  → ProfilePageComponent
/goals                    → GoalsPageComponent
/reflection               → ReflectionChamberPageComponent  (locked until Legend stage)
```

Default (`/`) redirects to `/spread`. Wildcard `**` also redirects to `/spread`.

---

## API Endpoints (consumed by frontend)

All requests go through Angular proxy → `http://localhost:8080`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login/register by email. Returns `AppUser`. |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/users/:userId` | Get current user profile |
| PUT | `/api/v1/users/:userId` | Update user (name, onboardingComplete, etc.) |
| POST | `/api/v1/users/:userId/avatar` | Upload avatar image (multipart/form-data) |
| POST | `/api/v1/users/:userId/generate-chibi` | Trigger AI chibi generation |

### Cards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/cards` | Get all user's cards (spread summary list) |
| POST | `/api/v1/cards` | Create new card (triggers AI generation) |
| GET | `/api/v1/cards/:cardId` | Get full card detail |
| PATCH | `/api/v1/cards/:cardId` | Update card fields (e.g., dreamText) |
| DELETE | `/api/v1/cards/:cardId` | Delete card |

### Habits
| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/v1/cards/:cardId/habits/:habitId/complete` | Mark habit complete/incomplete for today |

### Image Generation
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/cards/:cardId/generate-images` | Generate all stage images |
| POST | `/api/v1/cards/:cardId/generate-images/:stage` | Regenerate image for one stage |
| GET | `/api/v1/cards/:cardId/jobs/latest` | Poll latest generation job status |
| POST | `/api/v1/cards/:cardId/generate-stage-content` | Regenerate stage titles/lore/habits |

### Request convention
- Header `X-User-Id: <userId>` on every request
- Response envelope: `{ data: <payload> }`
- Images served from `/generated/...` path (also proxied to backend)

---

## File Structure

```
src/
├── app/
│   ├── app.component.*         Root component — just renders <router-outlet>
│   ├── app.config.ts           Angular bootstrapping (provideRouter, provideHttpClient)
│   ├── app.routes.ts           Top-level route tree
│   │
│   ├── features/               One folder per page/feature
│   │   ├── login/              Email login form
│   │   ├── onboarding/         Multi-step onboarding wizard
│   │   │   ├── onboarding-shell.component.*   Step router/controller
│   │   │   ├── onboarding.store.ts            Local signal store for onboarding state
│   │   │   ├── onboarding.model.ts            OnboardingStep type + OnboardingData interface
│   │   │   └── steps/                         One component per step
│   │   │       ├── welcome-step
│   │   │       ├── questions-step
│   │   │       ├── fear-input-step            Sub-component for individual fear questions
│   │   │       ├── philosophy-step            (transitional UI between steps)
│   │   │       ├── spread-reveal-step         (transitional UI)
│   │   │       └── card-reveal-step           Final reveal + generation polling
│   │   │
│   │   ├── spread/             Main dashboard — grid of all user cards
│   │   │   ├── spread-page.component.*        Page shell, loads SpreadStore
│   │   │   ├── spread-grid.component.*        Grid layout of card tiles
│   │   │   ├── spread-card-tile.component.*   Individual card summary tile
│   │   │   ├── spread.store.ts                Signals: cards[], loading, highestStage, totalStreak
│   │   │   └── spread.model.ts                SpreadCardSummary interface
│   │   │
│   │   ├── card-detail/        Full card view — image, stats, habits, stage nav
│   │   │   ├── card-detail-page.component.*   Page shell
│   │   │   ├── card-detail.store.ts           Signals: card, loading, nextStage; habit toggle; regen
│   │   │   ├── card-visual.component.*        Card image display
│   │   │   ├── card-stats-panel.component.*   Stage, progress %, streaks
│   │   │   ├── card-habits-list.component.*   Daily habits checklist
│   │   │   ├── card-stage-nav.component.*     Navigate between stage images
│   │   │   └── card-detail.model.ts
│   │   │
│   │   ├── card-evolved/       Celebration screen shown when card evolves to next stage
│   │   ├── edit-dream/         Edit the dream text for a card
│   │   ├── daily-checkin/      Daily habit check-in for all cards
│   │   │   └── daily-checkin.store.ts         ⚠ Still uses MockCardService — NOT wired to API
│   │   ├── add-aspect/         Form to add a new life aspect / card
│   │   ├── profile/            User profile — avatar, chibi, settings
│   │   ├── goals/              Goals + milestones tracker
│   │   │   └── goals.store.ts                 ⚠ Hardcoded mock data — NOT wired to API
│   │   └── reflection-chamber/ Locked page — unlocks at Legend stage (Day 365)
│   │
│   └── shared/
│       ├── components/
│       │   ├── nav-bar/                       Bottom navigation bar (Today/Spread/Goals/Profile)
│       │   ├── oracle-button/                 Styled CTA button
│       │   ├── progress-ring/                 Circular progress SVG
│       │   ├── stage-badge/                   Colored badge showing card stage
│       │   ├── skeleton-card-tile/            Loading skeleton for card grid
│       │   ├── loading-oracle/                Full-screen loading overlay
│       │   ├── generation-progress/           AI generation progress indicator
│       │   └── quick-input/                   Reusable text input with oracle styling
│       │
│       ├── guards/
│       │   ├── auth.guard.ts                  Redirects to /login if not authenticated
│       │   └── onboarding-complete.guard.ts   Redirects to /onboarding if not complete
│       │
│       ├── models/
│       │   ├── app-user.model.ts              AppUser interface
│       │   ├── aspect.model.ts                LifeAspect interface (key, label, icon, isCustom)
│       │   └── card-stage.model.ts            CardStage enum + STAGE_ORDER, STAGE_COLORS, STAGE_LABELS
│       │
│       ├── pipes/
│       │   ├── aspect-icon.pipe.ts            Maps aspect key → emoji icon
│       │   └── stage-color.pipe.ts            Maps CardStage → hex color string
│       │
│       └── services/
│           ├── api.service.ts                 ALL real HTTP calls to backend
│           ├── auth.service.ts                Login, logout, user signal, localStorage
│           ├── navigation.service.ts          Shared navigation helpers
│           ├── activity-parser.service.ts     Parses activity/event data
│           ├── mock-card.service.ts           ⚠ Legacy mock — being phased out
│           └── mock-user.service.ts           ⚠ Legacy mock — being phased out
│
├── assets/
│   ├── storm.png / fog.png / clearing.png     Stage background images
│   ├── aura.png / radiance.png / legend.png
│   ├── stage-storm.png                        Stage icon variant
│   ├── health-user1.png                       Fallback card image
│   └── frame/                                 Card frame art (AI)
│
├── environments/
│   ├── environment.ts                         Production — apiBaseUrl set by build
│   └── environment.development.ts             Dev — apiBaseUrl: '' (uses proxy)
│
└── styles/
    ├── styles.scss                            Global styles entry point
    ├── _tokens.scss                           Design tokens (colors, spacing, fonts)
    ├── _typography.scss                       Type scale
    ├── _mixins.scss                           SCSS mixins
    ├── _animations.scss                       Keyframe animations
    ├── _card-stages.scss                      Stage-specific color/glow styles
    └── _reset.scss                            CSS reset
```

---

## State Management Pattern

No NgRx. Each feature has its own `Store` class:

```ts
@Injectable()
export class FeatureStore {
  readonly data    = signal<Data | null>(null);
  readonly loading = signal(false);
  readonly derived = computed(() => /* ... */);

  load(): void { /* calls ApiService, updates signals */ }
}
```

Stores are provided at the component level (`providers: [FeatureStore]`) so they are destroyed with the component.

---

## AI Assistant Features (new)

4 new feature pages added for the AI personal assistant:

| Route | Feature | Description |
|-------|---------|-------------|
| `/chat` | **AI Chat** | Real-time SSE streaming chat with Claude AI. Suggestion chips, message history, auto-scroll. |
| `/tasks` | **Tasks** | AI-generated tasks with toggleable steps. XP awarded per step, progress bars, active/completed tabs. |
| `/plans` | **Saved Plans** | Browse saved workout/meal/routine plans. Click to view JSON content, version info, schedules. Delete support. |
| `/reminders` | **Reminders** | Create, complete, snooze (30min), and delete reminders. Repeat types: daily/weekly/monthly. Inline create form. |

All features use the existing dark theme design system, standalone components with OnPush change detection, and signal-based state management.

### New API Methods in ApiService

```
chatStream(), getConversations(), deleteConversation()
getPlans(), getPlanBySlug(), createPlan(), updatePlan(), deletePlan()
getActiveTasks(), getCompletedTasks(), toggleTaskStep(), abandonTask()
getReminders(), createReminder(), completeReminder(), snoozeReminder(), deleteReminder()
getTodayInsight()
```

### Updated Navigation

NavBar tabs: **Cards** | **Chat** | **Tasks** | **Goals** | **Profile**

---

## What Is Pending / Not Yet Wired

| Feature | Status | Notes |
|---|---|---|
| Daily Check-in | Partially mocked | `DailyCheckinStore` uses `MockCardService` — needs wiring to real API |
| Goals | Fully mocked | `GoalsStore` has hardcoded data — needs backend endpoints + API wiring |
| Reflection Chamber | UI placeholder only | Shows "unlocks on Day 365" message — no real unlock logic |
| Chibi generation | API exists | `generateChibi()` is in `ApiService` — UI polling may need work |
| Notifications | Model field exists | `notificationsEnabled` on `AppUser` but no UI/push logic |
| Edit Dream | Route exists | Component structure exists — verify full save flow |
| Add Aspect (multi-card) | Route exists | Second+ card flow may need onboarding guard review |

---

## Stage Effects — How to Change Them

All stage visual properties are controlled from **one file per layer**:

### Colors, labels, timeline (TypeScript)
**`src/app/shared/models/card-stage.model.ts`** → `STAGE_CONFIG`
```ts
[CardStage.Storm]: { color: '#6366f1', label: 'The Storm', days: 'Day 1–30' },
```
Change a color here → it flows through to `STAGE_COLORS`, `STAGE_LABELS`, `STAGE_DAYS`.

### Colors, CSS vars, glow shadows, animations (SCSS)
**`src/styles/_stage-config.scss`** — THE single source of truth for all SCSS stage data.
- `$stage-map` → generates `--stage-storm`, `--stage-fog`, etc. CSS vars
- `$cv-storm-rest / $cv-storm-pulse` → card frame glow in detail page
- `$tile-storm-rest / $tile-storm-pulse` → card tile glow in spread grid
- `$cv-storm-duration` → glow breathing speed

**`src/styles/_stage-animations.scss`** → @keyframes (references `_stage-config.scss` variables, do not edit directly)

### Per-stage FX content (particles, overlays)
Each stage has its own SCSS partial in `src/app/features/card-detail/`:
| File | Stage | What it contains |
|---|---|---|
| `_cv-storm.scss` | Storm | Rain, lightning, thunder |
| `_cv-fog.scss` | Fog | Mist layers, fog wisps |
| `_cv-clearing.scss` | Clearing | Golden light rays, dust motes |
| `_cv-aura.scss` | Aura | Energy rings, purple rays, glitter |
| `_cv-radiance.scss` | Radiance | Embers, golden bloom, sparks |
| `_cv-legend.scss` | Legend | Sakura petals, celestial halo |
| `_cv-shared.scss` | All | Cracks, lens flares, glitter system, near-evolved pulse |

---

## Key Design Decisions

- **Standalone components** everywhere — no NgModules.
- **Signals** preferred over RxJS for local state; RxJS used only for HTTP streams.
- **`X-User-Id` header** instead of Bearer tokens — keep auth simple for MVP.
- **`apiBaseUrl: ''`** in dev environment — the Angular proxy (`proxy.conf.json`) forwards `/api/*` and `/generated/*` to `:8080`, so no CORS issues.
- **Mock services** (`mock-card.service.ts`, `mock-user.service.ts`) are legacy from early development. `ApiService` is the real replacement. New code should use `ApiService`.
- **`stageContent` key normalization** — backend may return uppercase stage keys (`STORM`), frontend normalizes to lowercase in `ApiService.normalizeStageContent()`.
