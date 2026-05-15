# Desarrollo local y arranque — MedEats

Este documento explica el flujo de arranque recomendado para desarrollo local, pensado para que cualquier miembro del equipo pueda arrancar backend y mobile de forma consistente.

Requisitos mínimos:

- Node 22.x (recomendado). El repo incluye `.nvmrc` con la versión sugerida.
- Python 3.10+ y un virtualenv con las dependencias del backend.

Arranque unificado (recomendado desde la raíz del repo):

```bash
cd /path/to/MedEats
nvm use
npm run dev
```

- `npm run dev` ejecuta `scripts/dev.sh`, que valida Node (22.x), arranca Django en `0.0.0.0:8000` y posteriormente arranca Expo en `med-eats-mobile` con caché limpia.

Arranque manual (por separado):

Backend:

```bash
cd /path/to/MedEats/med-eats-backend
source ../.venv/bin/activate   # o activa el venv que uses
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Frontend (móvil):

```bash
cd /path/to/MedEats/med-eats-mobile
nvm use
npm install
npm run lint
npm run start:clean
```

Alternativa sin `nvm` (temporal):

```bash
cd /path/to/MedEats/med-eats-mobile
npx -y node@22 ./node_modules/expo/bin/cli start --clear
```

Desde VS Code:

- Abrir `Run Task` → seleccionar `MedEats: Dev` para ejecutar el flujo unificado en el terminal integrado.

Notas operativas:

- Si Expo devuelve "Invalid project root" revisa que no pegaste comandos con comentarios (`#`) en la misma línea.
- Si algún puerto está ocupado (8081, 8082, 8000) usa `lsof -ti PORT | xargs -r kill` para liberarlo.

Si quieres que añada este contenido también dentro de `GUIA_COMPLETA_PROYECTO.md` en lugar de dejarlo como documento nuevo, lo sincronizo allí también.
