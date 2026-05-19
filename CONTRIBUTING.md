# Contributing Guide – MedEats

## 1) Workflow policy

- Use **GitHub Flow**.
- Never push directly to `main`.
- Create **one branch per user story, requirement, or bug**.

## 2) Branch naming

- `feature/USXX-short-description`
- `feature/FRXX-short-description`
- `bugfix/USXX-short-description`
- `chore/short-description`

Examples:
- `feature/US10-feed-screen`
- `feature/FR08-restaurant-details`
- `bugfix/US05-map-animation`

## 3) Commit convention (mandatory)

Use Conventional Commits:
- `feat(mobile): add restaurant detail header (US08)`
- `feat(api): create restaurant serializer and endpoint (FR08)`
- `fix(mobile): avoid crash when search has no results`
- `test(api): add tests for post creation validation`
- `docs: update sprint 0 development plan`

## 4) Pull request checklist

Every PR must include:
- [ ] Linked US/FR in title or description.
- [ ] Acceptance criteria checklist.
- [ ] Screenshots/video evidence (if UI change).
- [ ] Test evidence (manual or automated).
- [ ] No lint/type errors.
- [ ] Reviewer assigned.

## 5) Merge policy

- Preferred merge mode: **Squash and merge**.
- Delete branch after merge.
- Keep `main` always releasable.

## 6) Suggested branch lifecycle per requirement

1. Create branch from updated `main`.
2. Implement small commits with clear messages.
3. Rebase/sync with `main` if needed.
4. Open PR with evidence.
5. Address review comments.
6. Merge when CI is green and AC are validated.

## 7) Desarrollo local (arranque estándar)

Para que todos los desarrolladores arranquen el proyecto de forma consistente, añadimos un script unificado en la raíz del repo.

- Asegúrate de usar Node 22.x: `nvm use` (el proyecto incluye `.nvmrc`).
- Levanta backend + app móvil con una sola orden desde la raíz:

```bash
cd /path/to/MedEats
nvm use
npm run dev
```

Este comando valida la versión de Node, arranca el backend Django en `0.0.0.0:8000` y luego inicia Expo con caché limpia.

Si prefieres iniciar los servicios por separado, la guía de `README.md` y `docs/RUNBOOK_OPERATIVO.md` describen el flujo manual.

