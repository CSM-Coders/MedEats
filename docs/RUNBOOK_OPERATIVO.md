# Runbook Operativo – MedEats

Guía práctica para ejecutar, depurar y liberar el proyecto.

---

## 1) Requisitos

- Node 22.x (recomendado; usar `nvm use` antes de iniciar)
- Python 3.10+
- PostgreSQL activo
- Dependencias instaladas en frontend y backend

---

## 2) Levantar entorno local

## Backend

```bash
cd /Users/camiloalvarez/Documents/MedEats
source .venv/bin/activate
cd med-eats-backend
python manage.py check
python manage.py runserver 0.0.0.0:8000
```

## Frontend

Opción recomendada (unificada desde la raíz):

```bash
cd /Users/camiloalvarez/Documents/MedEats
nvm use
npm run dev    # levanta backend + Expo (limpio)
```

Arranque manual (solo frontend):

```bash
cd /Users/camiloalvarez/Documents/MedEats/med-eats-mobile
nvm use
npm install
npm run lint
npm run start:clean   # Expo con caché limpia
```

En Expo:
- `i` iOS simulator
- `a` Android
- QR para Expo Go

---

## 3) Verificaciones rápidas de salud

## Backend
```bash
python manage.py check
```

## Frontend
```bash
npm run lint
```

## CI local equivalente
- Frontend: lint + typecheck
- Backend: black/ruff/check

---

## 4) Troubleshooting frecuente

## Error `manage.py: command not found`
Causa: ejecutar `manage.py` sin `python`.

Solución:
```bash
python manage.py runserver
```

## Puerto ocupado (backend/frontend)
```bash
lsof -ti:8000 | xargs kill -9
lsof -ti:8081 | xargs kill -9
lsof -ti:19000 | xargs kill -9
```

## Expo no arranca correctamente
```bash
npm install
npm start -- --clear
```

## Django DB error de conexión
- Verificar PostgreSQL activo.
- Verificar DB `medeats` creada.
- Revisar `DATABASES` en `config/settings.py`.

---

## 5) Flujo de release (equipo)

1. Crear rama por feature/bug.
2. Implementar + pruebas locales.
3. Ejecutar validaciones (`lint`, `check`).
4. Commit con formato profesional.
5. Push y abrir PR.
6. Revisiones + merge a `main`.

---

## 6) Checklist antes de merge

- [ ] Frontend lint en verde
- [ ] Backend check en verde
- [ ] PR con descripción y alcance
- [ ] No secretos hardcodeados
- [ ] Cambios alineados con backlog del sprint

---

## 7) Comandos útiles

```bash
# Ver rama actual
git branch --show-current

# Ver estado
git status --short --branch

# Ver commits recientes
git log --oneline -n 10
```
