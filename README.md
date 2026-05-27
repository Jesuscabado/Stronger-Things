# StrongerThings

Aplicación web **full-stack** para gestionar partidas de **Dungeons & Dragons 5e**. Orientada a grupos con un Director de Juego (DM) y varios jugadores, cubre la creación y seguimiento de personajes, gestión de campañas y sesiones, bestiario, catálogo de objetos y hechizos, diario de aventuras y un editor de mapas tácticos con generación de terreno mediante IA.

```
┌─────────────────────┐     HTTP      ┌──────────────────────┐     ODM      ┌────────────┐
│   React 18 + Vite   │ ──────────→   │   Express 5 API      │ ──────────→  │  MongoDB   │
│   localhost:5173    │               │   localhost:3001      │              │ Docker     │
└─────────────────────┘               └──────────┬───────────┘              └────────────┘
                                                  │
                              ┌───────────────────┼──────────────────┐
                              ▼                   ▼                  ▼
                        ┌──────────┐       ┌──────────┐      ┌────────────┐
                        │Cloudinary│       │ Anthropic│      │ Google     │
                        │PDFs/imgs │       │ Claude AI│      │ OAuth 2.0  │
                        └──────────┘       └──────────┘      └────────────┘
```

---

## Funcionalidades principales

### Para jugadores
- Registro/login con email+contraseña o cuenta Google
- Creación y edición completa de personajes D&D 5e (atributos, modificadores, combate, HP, inventario, hechizos, personalidad, físico, idiomas)
- Hoja de personaje imprimible en A4 (PDF del navegador)
- Subida de hojas externas en PDF (alojadas en Cloudinary)
- Avatares de personaje
- Diario de aventuras por personaje + vista global de crónicas

### Para el Director de Juego
- Gestión de campañas y sesiones de juego
- Bestiario completo con los monstruos del SRD 5e
- Editor de mapas tácticos (canvas con react-konva):
  - Pintura de terreno tile a tile
  - Tokens de criaturas/NPCs/objetos con imagen y vinculación al bestiario
  - Generación automática de mapas con Claude (Anthropic) a partir de descripción en lenguaje natural
  - Prompt y estilo guardados para regenerar el mapa
- Vinculación de mapas a sesiones

### Administración
- Panel de estadísticas y gestión de usuarios
- Control de roles (user / admin / DM)
- Concesión de acceso al editor de mapas por usuario

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, react-konva 18 |
| Backend | Node.js 20+, Express 5, ES Modules |
| Base de datos | MongoDB 7 + Mongoose 8 (Docker Compose) |
| Autenticación | JWT + bcrypt, Google OAuth 2.0 |
| IA | Anthropic SDK — Claude Sonnet (generación de mapas) |
| Almacenamiento | Cloudinary (PDFs y avatares) |
| CSS | Módulos CSS con dos temas: pergamino (claro) y dungeon (oscuro) |

---

## Estructura del repositorio

```
Stronger-Things/
├── client/          Frontend React + Vite  → ver client/README.md
├── server/          Backend Express + Mongo → ver server/README.md
├── .gitignore
└── README.md        (este archivo)
```

---

## Inicio rápido

### Requisitos

- Node.js ≥ 20
- Docker y Docker Compose
- Cuenta en [Cloudinary](https://cloudinary.com) (plan gratuito suficiente)
- API key de [Anthropic](https://console.anthropic.com) (opcional — solo para generación de mapas con IA)
- Client ID/Secret de Google (opcional — solo para login con Google)

### 1. Clonar

```bash
git clone <url-del-repo>
cd Stronger-Things
```

### 2. Variables de entorno

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edita ambos archivos con tus credenciales reales
```

### 3. Instalar dependencias

```bash
cd server && npm install
cd ../client && npm install --legacy-peer-deps
```

> `--legacy-peer-deps` es necesario por la compatibilidad de react-konva@18 con React 18.

### 4. Levantar MongoDB

```bash
cd server
docker compose up -d mongo
```

### 5. Seed del catálogo SRD (opcional)

```bash
cd server
npm run seed:download   # Descarga monstruos, hechizos y objetos del SRD
npm run seed            # Inserta en MongoDB + traduce con IA (requiere ANTHROPIC_API_KEY)
```

### 6. Arrancar

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Abre http://localhost:5173.

### 7. Crear el primer administrador

Tras registrarte, conecta a MongoDB y cambia tu `role` a `"admin"`:

```bash
docker exec -it monger_things mongosh -u <user> -p <pass> --authenticationDatabase admin
use StrongerThingsDB
db.users.updateOne({ email: "tu@email.com" }, { $set: { role: "admin" } })
```

---

## Licencia

ISC — ver detalles en `server/README.md`.

Los datos del SRD de D&D 5e están disponibles bajo **Creative Commons Attribution 4.0 (CC BY 4.0)** y son propiedad de Wizards of the Coast LLC. Cualquier uso del contenido del SRD debe incluir la atribución correspondiente.
