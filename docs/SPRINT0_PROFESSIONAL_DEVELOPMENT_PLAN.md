# MedEats – Sprint 0 Professional Development Plan

**Last update:** 2026-03-17  
**Scope:** Mobile (Expo/React Native) + Backend (Django/DRF) + Process (GitHub Flow)

---

## 1) Current baseline (what is already implemented)

### 1.1 Mobile

#### ✅ Implemented
- Interactive map on Home screen centered on Medellín (`react-native-maps`).
- Restaurant markers rendered from mock data.
- Search by restaurant name and category (client-side filtering).
- Result count and map camera animation on search submit.
- User location permission + current position (`expo-location`).
- Recenter button to user location / Medellín fallback.
- Marker popup card with image, rating, category and CTA to details screen.
- Tab navigation skeleton: Home, Feed, Create, Profile.

#### ⚠️ Partially implemented
- Restaurant details route exists (`/restaurant/[id]`), but currently shows only a placeholder with id.

#### ❌ Not implemented yet (mobile)
- Auth screens and auth state (register/login/logout).
- Real social feed (currently placeholder tab).
- Create post flow with media picker/video upload/rating submission.
- Profile page with posts/followers/following/edit profile.
- Filters by rating/distance/category combinations (advanced filter UI).
- Favorites, follow/unfollow, likes/comments integrated with backend.
- WhatsApp deep-link action for restaurant contact.
- AI semantic search on mobile connected to backend.

### 1.2 Backend

#### ✅ Implemented
- Django project scaffold and admin route.
- Dependencies installed for DRF/CORS/PostgreSQL.

#### ❌ Not implemented yet (backend)
- Domain models (`User profile`, `Restaurant`, `Post`, `Review`, `Follow`, `Favorite`).
- DRF serializers/viewsets/endpoints.
- JWT authentication and role-based permissions.
- Search/filter endpoints and AI category endpoint.
- Feed, likes, comments, follow endpoints.
- Media storage strategy and upload endpoints.
- Automated tests for API and domain logic.

---

## 2) Gap analysis vs Sprint 1 backlog (US05–US11)

| Story | Status | Evidence | Remaining work |
|---|---|---|---|
| US05 Display restaurants on map | **In progress (high)** | Home map + markers + interactions are working | Connect markers to backend data; error/loading states |
| US06 Search by name | **In progress (high)** | Search by name/category already filtering mocks | Backend search endpoint + debounce + analytics |
| US07 AI-based category search | **Not started** | No AI endpoint integration | Implement semantic search API + mobile UI states |
| US08 View details from map | **In progress (low-medium)** | Marker card opens details route | Build full detail screen + backend restaurant detail endpoint |
| US09 Filters (category/rating/distance) | **Not started** | No dedicated filter controls | Add filter model, UI chips/modal, distance calc, combined filters |
| US10 View social feed | **Not started** | Feed tab placeholder | Build feed UI + post cards + backend feed endpoint |
| US11 Create social post | **Not started** | Create tab placeholder | Build create flow with image/video/rating/caption + create endpoint |

---

## 3) Professional execution plan (step by step)

## Phase A — Sprint 0 hardening (2–3 days)
1. **Freeze baseline** and tag `v0.1-baseline`.
2. **Define DoR/DoD** per story.
3. **Create engineering standards** (branching, commits, PR checklist, tests).
4. **Integrate design reference** from Figma-exported mockup into repository.
5. **Create technical backlog** with tasks split by frontend/backend/QA.

### Deliverables
- `docs/SPRINT0_PROFESSIONAL_DEVELOPMENT_PLAN.md` (this file)
- `CONTRIBUTING.md` (workflow standards)
- `med-eats-mobile/design-reference/` (mockup reference integrated)

## Phase B — Domain and API foundation (4–6 days)
1. Create backend models and migrations.
2. Build DRF serializers/viewsets with nested read models for mobile.
3. Configure JWT auth (access/refresh).
4. Add permissions (`IsAuthenticated`, role checks for admin ops).
5. Seed script with Medellín restaurants + sample users/posts.
6. Implement core endpoints:
   - `/api/restaurants/`
   - `/api/restaurants/{id}/`
   - `/api/feed/`
   - `/api/posts/`
   - `/api/search?q=`
7. Add API tests and minimum coverage target (>=70% in MVP).

## Phase C — Sprint 1 functional completion (mobile) (6–10 days)
1. **US08** full restaurant detail screen.
2. **US10** feed screen with local cache/loading/empty states.
3. **US11** create post flow with media picker and rating.
4. **US09** filter modal + combinable filters.
5. **US07** AI search integration and fallback to lexical search.
6. Replace mocks gradually with API calls (feature flags if needed).

## Phase D — Quality gate and release candidate (2–3 days)
1. Manual test matrix execution (TC-US05…TC-US11).
2. Bug triage + fixes.
3. CI green pipeline (lint + typecheck + backend checks + tests).
4. Tag `v1.0-sprint1-rc` and merge to `main`.

---

## 4) Working model “as in companies” (mandatory from now on)

### 4.1 Branch strategy (GitHub Flow + requirement branches)
- `main`: always releasable.
- One branch per requirement/story/bug.

**Branch naming standard**
- Feature/story: `feature/US10-feed-screen`
- Requirement slice: `feature/FR08-restaurant-details`
- Bugfix: `bugfix/US05-map-marker-crash`
- Chore/process: `chore/sprint0-docs-and-standards`

### 4.2 Commit strategy (Conventional Commits)
- `feat(mobile): implement feed post card list (US10)`
- `feat(api): add restaurant detail endpoint (FR08)`
- `fix(mobile): prevent map animation crash on empty results`
- `test(api): add post creation validation tests`
- `docs(process): add PR checklist and branch policy`

### 4.3 Pull request policy
Each PR must include:
1. Story/Requirement link (US/FR).
2. Acceptance criteria checklist.
3. Test evidence (screenshots/video/test output).
4. Risks and rollback note.
5. Reviewer approval before merge.

---

## 5) Priority implementation order (recommended)

1. **US08** Restaurant detail end-to-end (quick win).  
2. **US10** Feed with mocks aligned to Figma.  
3. **US11** Create post (mock publish + backend contract).  
4. **US09** Combined filters.  
5. **US07** AI search endpoint + integration.  
6. Auth and social interactions full integration (FR02/03/13/14/15).

---

## 6) Definition of Done (DoD) for every requirement

A requirement is **Done** only if:
- Code is on dedicated branch.
- At least one meaningful commit per task block.
- PR created and reviewed.
- Lint/typecheck/tests pass.
- Acceptance criteria validated.
- Evidence attached (screenshots/video + test notes).
- Merged to `main` with squash merge and clean history.

---

## 7) Risks and mitigations

- **Risk:** Scope too large for semester.  
  **Mitigation:** Keep strict MVP boundary and phase optional features.
- **Risk:** Frontend-backend contract drift.  
  **Mitigation:** Define API contract docs first and mock by contract.
- **Risk:** Media upload complexity.  
  **Mitigation:** Start with image-only MVP, then add video.
- **Risk:** AI search reliability.  
  **Mitigation:** fallback lexical search + telemetry for query quality.

---

## 8) Immediate next execution (next 3 branches)

1. `chore/sprint0-process-setup`  
   - Add CI checks + PR template + contribution guide.
2. `feature/US08-restaurant-detail-screen`  
   - Build mobile detail screen from mockup + API contract.
3. `feature/US10-feed-mvp`  
   - Build feed UI from integrated Figma reference and mock data.

