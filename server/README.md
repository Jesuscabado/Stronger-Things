# StrongerThings

> Aplicación full-stack para gestionar personajes, inventarios, hechizos y diarios de aventuras siguiendo las reglas de **Dungeons & Dragons 5e**. Cada usuario gestiona sus propios personajes, comparte catálogos de objetos y hechizos, y puede imprimir hojas de personaje en formato A4 listas para llevar a la mesa.

![Status](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## Tabla de contenidos

- [Características](#características)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Requisitos previos](#requisitos-previos)
- [Setup paso a paso](#setup-paso-a-paso)
  - [1. Clonar el repo](#1-clonar-el-repo)
  - [2. Crear cuenta de Cloudinary](#2-crear-cuenta-de-cloudinary)
  - [3. Variables de entorno](#3-variables-de-entorno)
  - [4. Instalar dependencias](#4-instalar-dependencias)
  - [5. Levantar la base de datos](#5-levantar-la-base-de-datos)
  - [6. Sembrar el catálogo de hechizos](#6-sembrar-el-catálogo-de-hechizos-opcional)
  - [7. Arrancar el backend](#7-arrancar-el-backend)
  - [8. Arrancar el frontend](#8-arrancar-el-frontend)
  - [9. Promover usuario a administrador](#9-promover-usuario-a-administrador)
- [Endpoints](#endpoints)
- [Modelos](#modelos)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Comandos útiles](#comandos-útiles)
- [Errores frecuentes](#errores-frecuentes)
- [Licencia](#licencia)

---

## Características

- **Autenticación con JWT.** Registro, login y sesiones persistentes.
- **Gestión completa de personajes D&D 5e:** atributos, modificadores, salvaciones, habilidades, combate, HP, inventario, personalidad, físico, idiomas, competencias.
- **Sistema de hechizos completo.** Catálogo compartido con ~300 hechizos oficiales, espacios de conjuro, hechizos preparados, aptitud mágica.
- **Inventario rico.** Items con cantidad, durabilidad, equipado, notas y customName que conviven con un catálogo común de objetos.
- **Hoja de personaje imprimible.** Multi-página A4 lista para imprimir o guardar como PDF, con toggles para imprimir vacía a mano o incluir el avatar.
- **Diario de aventuras.** Cada personaje tiene su diario; una página global "Crónicas" agrega las entradas de todos tus personajes.
- **Subida de hojas externas.** Si prefieres usar tu propia ficha en PDF, se sube a Cloudinary y se previsualiza inline.
- **Avatares de personaje** alojados en Cloudinary.
- **Vista de administrador** con estadísticas y gestión de usuarios.
- **Modo oscuro.** Toggle entre tema "pergamino" (claro) y "dungeon" (oscuro), persistente en localStorage.
- **Responsive completo.** Funciona en desktop, tablet y móvil, con menú hamburguesa y barras de pestañas con scroll horizontal.

---

## Stack

**Backend**
- Node.js 20+ con ES Modules
- Express 5
- MongoDB 7 + Mongoose 8
- JWT + bcrypt para autenticación
- Multer para recibir archivos
- Cloudinary para almacenamiento de PDFs y avatares
- Docker Compose para MongoDB en local

**Frontend**
- React 18 + Vite
- React Router 6
- Fetch API (sin librerías HTTP externas)
- CSS personalizado modular con tema D&D (pergamino + dungeon)

---

## Arquitectura

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   React + Vite   │ ──HTTP─→│   Express API    │ ──ODM──→│     MongoDB      │
│  (localhost:5173)│         │ (localhost:3001) │         │ (localhost:27027)│
└──────────────────┘         └─────────┬────────┘         └──────────────────┘
                                       │
                                       │ Subida PDFs / avatares
                                       ▼
                              ┌──────────────────┐
                              │    Cloudinary    │
                              │     (CDN/SaaS)   │
                              └──────────────────┘
```

---

## Estructura del repositorio

El proyecto es un **monorepo** con cliente y servidor en subcarpetas:

```
Stronger-Things-Backend/         ← raíz del repo
├── client/                      ← Frontend React + Vite
├── server/                      ← Backend Express + Mongo
├── README.md
├── MEMORIA.md                   ← Bitácora del proyecto
└── .gitignore
```

---

## Requisitos previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js 20 o superior** ([descargar](https://nodejs.org))
- **Docker y Docker Compose** ([descargar](https://www.docker.com))
- **Git**
- Una cuenta de **Cloudinary** (gratuita, sin tarjeta)

Verifica:

```bash
node --version       # v20.x.x o superior
docker --version
docker compose version
```

---

## Setup paso a paso

### 1. Clonar el repo

```bash
git clone https://github.com/Jesuscabado/Stronger-Things-Backend.git
cd Stronger-Things-Backend
```

A partir de aquí, todos los comandos se ejecutan desde la raíz del repo a menos que se indique lo contrario.

### 2. Crear cuenta de Cloudinary

Cloudinary aloja los PDFs de hojas de personaje y los avatares. El plan gratuito da 25 GB de almacenamiento y 25 GB de banda al mes, más que suficiente para este proyecto.

1. Ve a https://cloudinary.com → **Sign up for free**.
2. Tras registrarte verás el **Dashboard**.
3. En "Product Environment Credentials" copia tres datos:
   - `Cloud name`
   - `API Key`
   - `API Secret`
4. **Activa la entrega de PDFs:**
   - Settings (engranaje arriba a la derecha) → **Security**.
   - Marca **"Allow delivery of PDF and ZIP files"**.
   - **Save**.

   Sin este paso, el visor de PDF del front no funcionará.

### 3. Variables de entorno

#### Backend — crea `server/.env`

```env
# ── Servidor ──
APP_HOST=StrongerThings
APP_PORT=3001

# ── MongoDB ──
# Para desarrollo local con Docker:
MONGO_HOST=localhost
MONGO_PORT=27027
MONGO_USER=tu_usuario_mongo
MONGO_PASSWORD=tu_password_mongo
MONGO_DB=StrongerThingsDB

# Sólo si arrancas la app dentro de Docker (no por npm run dev):
MONGO_CONTAINER_NAME=monger_things
MONGO_INTERNAL_PORT=27017

# ── Autenticación JWT ──
# IMPORTANTE: usa una cadena larga, aleatoria y secreta.
# Genérala con:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=cambia_esto_por_una_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=1d

# ── Cloudinary ──
# Valores del Dashboard de https://cloudinary.com
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=000000000000000
CLOUDINARY_API_SECRET=tu_api_secret_aqui

# ── CORS / Front ──
FRONTEND_URL=http://localhost:5173
```

⚠️ `server/.env` está en `.gitignore` y **no debe subirse a Git**.

#### Frontend — crea `client/.env`

```env
VITE_API_URL=http://localhost:3001
```

Sin barra al final. Si cambias este valor, hay que reiniciar el dev server del front.

### 4. Instalar dependencias

```bash
cd server && npm install
cd ../client && npm install
cd ..
```

### 5. Levantar la base de datos

Desde `server/`:

```bash
cd server
docker compose up -d mongo
```

Verifica que está corriendo:

```bash
docker compose ps
```

Deberías ver `monger_things` con estado `Up` y el puerto `0.0.0.0:27027->27017/tcp`.

**Conexión opcional desde MongoDB Compass:**

```
mongodb://Mike:TheCakeIsALie@localhost:27027/?authSource=admin
```

### 6. Sembrar el catálogo de hechizos (opcional)

Si quieres tener el catálogo de ~300 hechizos oficiales de D&D 5e listo desde el principio, ejecuta el script de seed desde `server/`:

```bash
npm run seed:spells
```

Descarga el catálogo de la [D&D 5e API oficial](https://www.dnd5eapi.co/), traduce los campos al español y los inserta en MongoDB. Tarda un par de minutos.

> Si no lo haces, el catálogo arrancará vacío y podrás crear los hechizos manualmente desde la página `/spells`.

### 7. Arrancar el backend

Desde `server/`:

```bash
npm run dev
```

Verás algo así:

```
🔌 Conectando a: mongodb://Mike:***@localhost:27027/StrongerThingsDB?authSource=admin
✅ Conectado a MongoDB (StrongerThingsDB@localhost)
🚀 StrongerThings API en marcha en http://localhost:3001
```

### 8. Arrancar el frontend

En otra terminal, desde `client/`:

```bash
npm run dev
```

Abrirá automáticamente http://localhost:5173.

### 9. Promover usuario a administrador

El primer admin se crea manualmente. Tras registrarte, hay dos formas:

**Opción A: MongoDB Compass**

1. Conecta con `mongodb://Mike:TheCakeIsALie@localhost:27027/?authSource=admin`.
2. Base de datos `StrongerThingsDB` → colección `users`.
3. Edita tu documento y cambia `role` de `"user"` a `"admin"`.
4. **Cierra sesión y vuelve a entrar** en el front para que se aplique.

**Opción B: `mongosh` dentro del contenedor**

```bash
docker exec -it monger_things mongosh -u Mike -p TheCakeIsALie --authenticationDatabase admin

use StrongerThingsDB
db.users.updateOne(
    { email: "tu_email@dominio.com" },
    { $set: { role: "admin" } }
)
```

A partir de aquí podrás gestionar otros usuarios desde el panel `/admin` del front.

---

## Endpoints

Todas las respuestas son JSON. Las rutas marcadas con 🔒 requieren cabecera:

```
Authorization: Bearer <token>
```

Las marcadas con 👑 requieren además rol de administrador.

### Autenticación

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| POST | `/api/auth/register` |  | `{ username, email, password }` | Registra usuario |
| POST | `/api/auth/login` |  | `{ email, password }` | Devuelve `{ user, token }` |
| GET | `/api/auth/me` | 🔒 |  | Usuario actual |

### Catálogo de objetos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/objects` |  | Lista todo el catálogo |
| GET | `/api/objects/:id` |  | Detalle |
| POST | `/api/objects` | 🔒 | Crear objeto |
| PUT | `/api/objects/:id` | 🔒 | Actualizar |
| DELETE | `/api/objects/:id` | 🔒 | Eliminar |

### Catálogo de hechizos

| Método | Ruta | Auth | Query params | Descripción |
|---|---|---|---|---|
| GET | `/api/spells` | 🔒 | `?search`, `?level`, `?class` | Lista filtrada |
| GET | `/api/spells/:id` | 🔒 |  | Detalle |
| POST | `/api/spells` | 🔒 |  | Crear hechizo |
| DELETE | `/api/spells/:id` | 🔒 |  | Eliminar (catálogo compartido) |

### Personajes

| Método | Ruta | Descripción |
|---|---|---|
| GET 🔒 | `/api/characters` | Personajes del usuario |
| POST 🔒 | `/api/characters` | Crear |
| GET 🔒 | `/api/characters/:id` | Detalle con todo poblado |
| PUT 🔒 | `/api/characters/:id` | Actualizar |
| DELETE 🔒 | `/api/characters/:id` | Eliminar |

### Inventario

| Método | Ruta | Descripción |
|---|---|---|
| POST 🔒 | `/api/characters/:id/inventory` | Añadir item |
| PUT 🔒 | `/api/characters/:id/inventory/:itemId` | Actualizar item |
| DELETE 🔒 | `/api/characters/:id/inventory/:itemId` | Eliminar item |

### Hechizos aprendidos por el personaje

| Método | Ruta | Descripción |
|---|---|---|
| POST 🔒 | `/api/characters/:id/spells` | Aprender hechizo |
| PATCH 🔒 | `/api/characters/:id/spells/:knownId` | Actualizar (preparado, notas) |
| DELETE 🔒 | `/api/characters/:id/spells/:knownId` | Olvidar |

### Diario

| Método | Ruta | Descripción |
|---|---|---|
| POST 🔒 | `/api/characters/:id/diary` | Crear entrada |
| PUT 🔒 | `/api/characters/:id/diary/:entryId` | Editar entrada |
| DELETE 🔒 | `/api/characters/:id/diary/:entryId` | Eliminar entrada |

### Hoja de personaje (PDF subido por el usuario)

| Método | Ruta | Descripción |
|---|---|---|
| POST 🔒 | `/api/characters/:id/sheet` | Subir PDF (campo `sheet`, máx 50MB) |
| GET 🔒 | `/api/characters/:id/sheet` | Descargar (redirige a Cloudinary) |
| DELETE 🔒 | `/api/characters/:id/sheet` | Eliminar |

### Avatar

| Método | Ruta | Descripción |
|---|---|---|
| POST 🔒 | `/api/characters/:id/avatar` | Subir avatar (campo `avatar`, imagen) |
| DELETE 🔒 | `/api/characters/:id/avatar` | Eliminar |

### Administración

| Método | Ruta | Descripción |
|---|---|---|
| GET 🔒👑 | `/api/admin/stats` | Estadísticas globales |
| GET 🔒👑 | `/api/admin/users` | Listar todos los usuarios |
| PUT 🔒👑 | `/api/admin/users/:id/role` | Cambiar rol |
| DELETE 🔒👑 | `/api/admin/users/:id` | Eliminar usuario + sus personajes |

---

## Modelos

### User

```javascript
{ username, email, password_hash, role: "user" | "admin" }
```

### BaseObject (catálogo de objetos)

```javascript
{
    name, description, category, cost,
    stats: { damage, damageType, attackBonus, armorClass, weight,
             properties[], rarity, requiresAttunement, maxDurability }
}
```

### Spell (catálogo de hechizos)

```javascript
{
    name, nameOriginal, description, atHigherLevels,
    level,                    // 0..9 (0 = truco)
    school,                   // Evocación, Abjuración, etc.
    castingTime, range, duration,
    concentration, ritual,
    components: { verbal, somatic, material, materialDesc },
    damageType,
    classes: [String]         // Qué clases pueden lanzarlo
}
```

### Character

```javascript
{
    user, name, charClass, race, level, alignment, background,
    experiencePoints, inspiration, gold,

    abilityScores: { strength, dexterity, constitution,
                     intelligence, wisdom, charisma },

    combatStats: {
        armorClass, initiative, speed,
        hitDice: { type, total, used },
        deathSaves: { successes, failures }
    },

    hitPoints: { current, max, temporary },

    proficiencies: {
        savingThrows: { strength, dexterity, ... },
        skills: { acrobatics, athletics, ... },
        languages: [String],
        other: [String]
    },

    personality: {
        traits, ideals, bonds, flaws,
        backstory, appearance, allies, featuresAndTraits, treasure
    },

    physical: { age, height, weight, eyes, skin, hair },

    inventory: [{ baseObject, customName, quantity,
                  durability, equipped, notes }],

    spellcasting: {
        ability,                  // "intelligence" | "wisdom" | "charisma"
        attackBonus, saveDC,
        spellSlots: {
            level1: { total, used },
            ... level9: { total, used }
        },
        spellsKnown: [{ spell, prepared, notes }]
    },

    diary: [{ title, date, content, createdAt, updatedAt }],

    avatar: { cloudinaryUrl, cloudinaryPublicId },
    characterSheet: { filename, mimeType, size, uploadedAt,
                      cloudinaryPublicId, cloudinaryUrl }
}
```

---

## Estructura de carpetas

### Backend (`server/`)

```
server/
├── src/
│   ├── config/
│   │   ├── db.js              Conexión a MongoDB
│   │   ├── loadEnv.js         Carga dotenv lo primero
│   │   └── upload.js          Multer en memoria
│   ├── controllers/           Manejo HTTP
│   ├── middlewares/           Auth, validaciones, errores
│   ├── models/                Esquemas Mongoose
│   ├── routes/                Endpoints
│   ├── services/              Lógica de negocio + Cloudinary
│   ├── utils/                 Logger, helpers
│   ├── seed.js                Pobla datos de ejemplo
│   ├── seed-spells.js         Importa hechizos de la API oficial
│   └── index.js
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

### Frontend (`client/`)

```
client/
├── src/
│   ├── api/                       Clientes HTTP por feature
│   │   ├── client.js              Wrapper de fetch
│   │   ├── auth.js, characters.js, objects.js, spells.js, admin.js
│   ├── components/
│   │   ├── ui/                    Componentes "tontos" reutilizables
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── PDFPreviewModal.jsx
│   │   ├── layout/                Navegación y estructura
│   │   │   ├── Header.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   └── character/             Pestañas del editor de personaje
│   │       ├── GeneralSection.jsx
│   │       ├── StatsSection.jsx
│   │       ├── CombatSection.jsx
│   │       ├── InventorySection.jsx
│   │       ├── PersonalitySection.jsx
│   │       ├── SpellsSection.jsx
│   │       └── DiarySection.jsx
│   ├── context/                   AuthContext, ThemeContext, ToastContext
│   ├── pages/                     Una por ruta
│   │   ├── LoginPage.jsx, RegisterPage.jsx
│   │   ├── CharactersPage.jsx, CharacterDetailPage.jsx
│   │   ├── CharacterSheetPrint.jsx
│   │   ├── ObjectsPage.jsx, SpellsPage.jsx
│   │   ├── DiaryPage.jsx
│   │   └── AdminPage.jsx
│   ├── utils/                     dndLabels, dndCalc, helpers
│   ├── styles/                    CSS atomizado por capas
│   │   ├── index.css              Entry point (solo @imports)
│   │   ├── tokens.css             Variables :root
│   │   ├── base.css               Reset, body, tipografía
│   │   ├── layout.css             Container, grid, header
│   │   ├── forms.css              Formularios, botones, alertas
│   │   ├── components/            Un archivo por componente
│   │   ├── pages/                 auth.css, sheet-print.css
│   │   ├── themes/dark.css        Overrides del modo oscuro
│   │   ├── responsive.css         Media queries por breakpoint
│   │   └── print.css              @media print
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## Comandos útiles

Desde `server/`:

```bash
npm run dev              # Arranca backend con nodemon
npm start                # Arranca en modo producción
npm run seed             # Pobla datos básicos
npm run seed:spells      # Importa el catálogo de hechizos

docker compose up -d mongo            # Solo BD
docker compose down                   # Para todos los servicios
docker compose down -v                # Elimina también volúmenes (¡borra la BD!)
docker compose logs -f                # Sigue los logs
```

Desde `client/`:

```bash
npm run dev              # Dev server en http://localhost:5173
npm run build            # Build de producción a dist/
npm run preview          # Previsualiza el build
```

---

## Errores frecuentes

### "Bloqueado por CORS" o "Connection reset"

El backend no está accesible desde el navegador.

- Comprueba que `npm run dev` del backend imprimió `🚀 StrongerThings API en marcha en http://localhost:3001`.
- Si arrancas con Docker, asegúrate de que el contenedor escucha en `0.0.0.0`, no `localhost`.
- Verifica que `FRONTEND_URL` en `server/.env` es **exactamente** `http://localhost:5173` (sin barra final).
- Si nada de eso funciona: `docker compose down && docker compose up` suele resolver problemas de imágenes cacheadas.

### "MongoServerError: Authentication failed"

Las credenciales de `server/.env` no coinciden con las del `docker-compose.yml`. Comprueba `MONGO_USER` y `MONGO_PASSWORD` en ambos.

### "EAI_AGAIN monger_things"

Estás arrancando el backend en local (`npm run dev`) pero `MONGO_HOST` está puesto al nombre del contenedor (`monger_things`), que solo se resuelve dentro de la red de Docker. Cambia a `MONGO_HOST=localhost` en `server/.env` o copia el `.env.example` que ya viene configurado para local.

### "Service Accounts do not have storage quota"

Resto histórico de la fase de Google Drive. **Ya no aplica:** el proyecto usa Cloudinary. Si ves este mensaje, alguien está usando una rama vieja.

### Modo oscuro: navbar invisible o ilegible

Asegúrate de tener el bloque `:root[data-theme="dark"] .app-header *` en `styles/themes/dark.css`. Si has refactorizado el CSS, revisa que ese archivo se importa desde `styles/index.css`.

### Variables de Vite que no cambian

Las variables `VITE_*` solo se leen al arrancar el dev server. Tras editar `client/.env`, mata `npm run dev` con `Ctrl+C` y arráncalo de nuevo.

### Las pestañas del personaje no se quedan pegadas (sticky)

Si tras una refactor el sticky se rompe al cambiar de pestaña, comprueba que en `styles/components/tabs.css` la animación `fadeIn` **no usa `transform`**, solo `opacity`. Cualquier ancestro con `transform` rompe `position: sticky` de los descendientes.

---

## Licencia

ISC. Ver `LICENSE` para más detalles.
