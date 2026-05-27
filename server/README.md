# StrongerThings — Backend

API REST con Node.js, Express 5 y MongoDB para la aplicación de gestión de partidas D&D 5e.

---

## Tabla de contenidos

- [Setup](#setup)
- [Variables de entorno](#variables-de-entorno)
- [Comandos](#comandos)
- [Endpoints](#endpoints)
- [Modelos de datos](#modelos-de-datos)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Errores frecuentes](#errores-frecuentes)

---

## Setup

### Requisitos

- Node.js ≥ 20
- Docker y Docker Compose

### Pasos

```bash
cd server
cp .env.example .env      # Rellena con tus credenciales reales
npm install
docker compose up -d mongo
npm run dev
```

La API queda disponible en `http://localhost:3001`.

---

## Variables de entorno

Crea `server/.env` a partir de `server/.env.example`:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `APP_PORT` | Puerto de la API | `3001` |
| `MONGO_HOST` | Host de MongoDB | `localhost` |
| `MONGO_PORT` | Puerto externo Docker | `27027` |
| `MONGO_USER` | Usuario MongoDB | `miusuario` |
| `MONGO_PASSWORD` | Contraseña MongoDB | `contraseña_segura` |
| `MONGO_DB` | Nombre de la base de datos | `StrongerThingsDB` |
| `JWT_SECRET` | Clave secreta para JWT — **genera una aleatoria** | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Duración del token | `1d` |
| `CLOUDINARY_CLOUD_NAME` | Nombre del entorno Cloudinary | `dxxxxxxxx` |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | `000000000000` |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | `xxxxx` |
| `ANTHROPIC_API_KEY` | API Key de Anthropic (generación de mapas con IA) | `sk-ant-...` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret OAuth Google | `xxx` |

> ⚠️ `server/.env` está en `.gitignore`. **Nunca lo subas a Git.**

---

## Comandos

```bash
npm run dev              # Arranca con nodemon (desarrollo)
npm start                # Arranca en producción

npm run seed:download    # Descarga JSON del SRD desde dnd5eapi.co
npm run seed             # Inserta datos SRD en MongoDB (traduce con IA si ANTHROPIC_API_KEY está definida)
npm run seed:monsters    # Inserta solo monstruos
```

---

## Endpoints

Todas las respuestas son `application/json`.

| Símbolo | Significado |
|---|---|
| 🔒 | Requiere `Authorization: Bearer <token>` |
| 👑 | Requiere además `role: "admin"` |
| 🗺️ | Requiere feature `"maps"` habilitada (o ser admin) |

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | | Registra usuario |
| POST | `/api/auth/login` | | Devuelve `{ user, token }` |
| POST | `/api/auth/google` | | Login/registro con Google |
| GET | `/api/auth/me` | 🔒 | Usuario actual |
| DELETE | `/api/auth/account` | 🔒 | Elimina la propia cuenta |

### Personajes

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/characters` | 🔒 | Personajes del usuario |
| POST | `/api/characters` | 🔒 | Crear personaje |
| GET | `/api/characters/:id` | 🔒 | Detalle completo |
| PUT | `/api/characters/:id` | 🔒 | Actualizar |
| DELETE | `/api/characters/:id` | 🔒 | Eliminar |
| POST | `/api/characters/:id/inventory` | 🔒 | Añadir item al inventario |
| PUT | `/api/characters/:id/inventory/:itemId` | 🔒 | Actualizar item |
| DELETE | `/api/characters/:id/inventory/:itemId` | 🔒 | Eliminar item |
| POST | `/api/characters/:id/spells` | 🔒 | Aprender hechizo |
| PATCH | `/api/characters/:id/spells/:knownId` | 🔒 | Actualizar hechizo aprendido |
| DELETE | `/api/characters/:id/spells/:knownId` | 🔒 | Olvidar hechizo |
| POST | `/api/characters/:id/diary` | 🔒 | Crear entrada de diario |
| PUT | `/api/characters/:id/diary/:entryId` | 🔒 | Editar entrada |
| DELETE | `/api/characters/:id/diary/:entryId` | 🔒 | Eliminar entrada |
| POST | `/api/characters/:id/avatar` | 🔒 | Subir avatar (multipart) |
| DELETE | `/api/characters/:id/avatar` | 🔒 | Eliminar avatar |
| POST | `/api/characters/:id/sheet` | 🔒 | Subir PDF de hoja (multipart, máx 50 MB) |
| GET | `/api/characters/:id/sheet` | 🔒 | Redirige a Cloudinary |
| DELETE | `/api/characters/:id/sheet` | 🔒 | Eliminar PDF |

### Catálogo de objetos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/objects` | | Lista todo el catálogo |
| GET | `/api/objects/:id` | | Detalle |
| GET | `/api/objects/check-name` | 🔒 | Comprueba nombre duplicado |
| POST | `/api/objects` | 🔒 | Crear objeto |
| PUT | `/api/objects/:id` | 🔒 | Actualizar |
| DELETE | `/api/objects/:id` | 🔒 | Eliminar |

### Hechizos

| Método | Ruta | Auth | Query | Descripción |
|---|---|---|---|---|
| GET | `/api/spells` | 🔒 | `search`, `level`, `class` | Lista filtrada |
| GET | `/api/spells/:id` | 🔒 | | Detalle |
| POST | `/api/spells` | 🔒 | | Crear hechizo |
| DELETE | `/api/spells/:id` | 🔒 | | Eliminar |

### Bestiario (monstruos)

| Método | Ruta | Auth | Query | Descripción |
|---|---|---|---|---|
| GET | `/api/monsters` | 🔒 | `search`, `type`, `cr` | Lista filtrada |
| GET | `/api/monsters/:id` | 🔒 | | Detalle completo |

### Campañas

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/campaigns` | 🔒 | Campañas del DM |
| POST | `/api/campaigns` | 🔒 | Crear campaña |
| GET | `/api/campaigns/:id` | 🔒 | Detalle |
| PUT | `/api/campaigns/:id` | 🔒 | Actualizar |
| DELETE | `/api/campaigns/:id` | 🔒 | Eliminar |

### Sesiones

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/sessions` | 🔒 | Sesiones del DM |
| POST | `/api/sessions` | 🔒 | Crear sesión |
| GET | `/api/sessions/:id` | 🔒 | Detalle con participantes y mapa |
| PUT | `/api/sessions/:id` | 🔒 | Actualizar (incluye vincular mapa) |
| DELETE | `/api/sessions/:id` | 🔒 | Eliminar |

### Mapas tácticos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/maps` | 🔒🗺️ | Mapas del usuario |
| POST | `/api/maps` | 🔒🗺️ | Crear mapa |
| GET | `/api/maps/:id` | 🔒🗺️ | Detalle con tokens populados |
| PUT | `/api/maps/:id` | 🔒🗺️ | Actualizar (terrain, tokens, aiMeta…) |
| DELETE | `/api/maps/:id` | 🔒🗺️ | Eliminar y desvincular de sesiones |
| POST | `/api/maps/generate` | 🔒🗺️ | Genera mapa con Claude (no guarda) |

### Administración

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/admin/stats` | 🔒👑 | Estadísticas globales |
| GET | `/api/admin/users` | 🔒👑 | Lista de usuarios |
| PUT | `/api/admin/users/:id/role` | 🔒👑 | Cambiar `role` (user/admin) |
| PUT | `/api/admin/users/:id/dm` | 🔒👑 | Toggle `isDM` |
| PUT | `/api/admin/users/:id/feature` | 🔒👑 | Conceder/revocar feature (`maps`) |
| DELETE | `/api/admin/users/:id` | 🔒👑 | Eliminar usuario y sus personajes |

---

## Modelos de datos

### User

```js
{
  username: String,
  email:    String,
  role:     "user" | "admin",
  isDM:     Boolean,
  features: [String],          // p.ej. ["maps"]
  googleId: String,
  provider: "local" | "google" | "both"
}
```

### Map

```js
{
  dm:          ObjectId → User,
  session:     ObjectId → Session,
  name:        String,
  description: String,
  grid:        { cols, rows, cellSize },
  terrain:     Array[][],        // terrain[row][col] = tileId
  walls:       [{ from:[col,row], to:[col,row] }],
  tokens: [{
    id:        String (UUID),
    kind:      "pc" | "monster" | "npc" | "object",
    name, x, y, color,
    monster:   ObjectId → Monster,
    character: ObjectId → Character,
    object:    ObjectId → BaseObject,
    hp:        { current, max },
    tokenImg:  String,           // ruta a /tiles/tokens/…
    notes:     String
  }],
  aiMeta: { prompt: String, style: String }
}
```

### Session

```js
{
  dm:           ObjectId → User,
  campaign:     ObjectId → Campaign,
  map:          ObjectId → Map,
  name, date, status, notes,
  participants: [ObjectId → Character]
}
```

### BaseObject

```js
{
  name, description, category, cost, isPublic,
  stats: {
    damage, damageType, attackBonus, armorClass,
    weight, properties[], rarity, requiresAttunement, maxDurability
  }
}
```

---

## Estructura de carpetas

```
server/src/
├── config/
│   ├── db.js              Conexión Mongoose
│   ├── loadEnv.js         Carga dotenv
│   └── upload.js          Multer en memoria
├── controllers/           Handlers HTTP (una función por endpoint)
├── middlewares/
│   ├── authRequired.js    Verifica JWT
│   ├── adminRequired.js   Verifica role === "admin"
│   ├── dmRequired.js      Verifica isDM === true
│   ├── featureRequired.js Verifica features[] o role admin
│   ├── errorHandler.js
│   └── validateBody.js    Validación de campos obligatorios y ObjectId
├── models/                Esquemas Mongoose
├── routes/                Express Router por recurso
├── services/
│   ├── anthropicClient.js Singleton del SDK de Anthropic
│   ├── mapService.js      CRUD de mapas + generación con IA
│   ├── translationService.js Traducciones del SRD
│   └── …
├── data/
│   └── tileCatalog.json   Referencia de tiles válidos
├── seed*.js               Scripts de población de datos
└── index.js               Entry point
```

---

## Errores frecuentes

**"Bloqueado por CORS"**
Verifica que `FRONTEND_URL` en `server/.env` sea exactamente `http://localhost:5173` sin barra final.

**"MongoServerError: Authentication failed"**
Las credenciales de `.env` no coinciden con las del `docker-compose.yml`.

**"Claude devolvió JSON inválido"**
El modelo puede añadir texto antes del JSON. El extractor `extractFirstJSON()` lo maneja en la mayoría de casos. Si persiste, revisa `ANTHROPIC_API_KEY` y que el modelo `claude-sonnet-4-6` esté disponible en tu plan.

**JWT expirado tras cambio de rol**
El token incluye el rol en el payload. Tras promover un usuario a admin, debe cerrar sesión y volver a entrar para obtener un token nuevo.

---

## Licencia

ISC.

Los datos del SRD de D&D 5e (monstruos, hechizos, objetos) son propiedad de **Wizards of the Coast LLC** y están disponibles bajo **Creative Commons Attribution 4.0 (CC BY 4.0)**. Cualquier distribución o uso comercial del contenido del SRD debe incluir la siguiente atribución:

> *Dungeons & Dragons™ and all related marks are property of Wizards of the Coast LLC. SRD content is licensed under CC BY 4.0.*
