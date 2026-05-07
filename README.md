# StrongerThings

> API RESTful y front en React para gestionar personajes e inventarios siguiendo las reglas de **Dungeons & Dragons 5e**. Cada usuario gestiona sus propios personajes, comparte un catálogo de objetos y puede subir su hoja de personaje como PDF a Cloudinary.

![Status](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## Tabla de contenidos

- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Setup paso a paso](#setup-paso-a-paso)
  - [1. Clonar y dependencias](#1-clonar-y-dependencias)
  - [2. Crear cuenta de Cloudinary](#2-crear-cuenta-de-cloudinary)
  - [3. Variables de entorno](#3-variables-de-entorno)
  - [4. Levantar la base de datos](#4-levantar-la-base-de-datos)
  - [5. Arrancar el backend](#5-arrancar-el-backend)
  - [6. Arrancar el front](#6-arrancar-el-front)
  - [7. Promover usuario a administrador](#7-promover-usuario-a-administrador)
- [Endpoints](#endpoints)
- [Modelos](#modelos)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Comandos útiles](#comandos-útiles)
- [Errores frecuentes](#errores-frecuentes)
- [Licencia](#licencia)

---

## Stack

**Backend**
- Node.js 20+ con ES Modules
- Express 5
- MongoDB 7 + Mongoose 8
- JWT + bcrypt para autenticación
- Multer para recibir archivos
- Cloudinary para almacenamiento de PDFs
- Docker Compose para entorno local

**Frontend**
- React 18 + Vite
- React Router 6
- Fetch API (sin librerías HTTP externas)
- CSS personalizado con tema D&D (pergamino + dungeon)

---

## Arquitectura

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   React + Vite   │ ──HTTP─→│   Express API    │ ──ODM──→│     MongoDB      │
│  (localhost:5173)│         │ (localhost:3001) │         │ (localhost:27027)│
└──────────────────┘         └─────────┬────────┘         └──────────────────┘
                                       │
                                       │ Subida de PDF
                                       ▼
                              ┌──────────────────┐
                              │    Cloudinary    │
                              │     (CDN/SaaS)   │
                              └──────────────────┘
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

### 1. Clonar y dependencias

```bash
# Backend
git clone https://github.com/Jesuscabado/Stronger-Things-Backend.git
cd Stronger-Things-Backend
npm install

# Front (en otra carpeta)
git clone https://github.com/Jesuscabado/Stronger-Things-Front.git
cd Stronger-Things-Front
npm install
```

### 2. Crear cuenta de Cloudinary

Cloudinary aloja los PDFs de las hojas de personaje. El plan gratuito da 25 GB de almacenamiento y 25 GB de banda al mes — más que suficiente para este proyecto.

1. Ve a https://cloudinary.com → **Sign up for free**.
2. Tras registrarte verás el **Dashboard**.
3. En el bloque "Product Environment Credentials" copia tres datos:
   - `Cloud name`
   - `API Key`
   - `API Secret`
4. **Activa la entrega de PDFs:**
   - Settings (icono engranaje arriba a la derecha) → **Security**.
   - Marca **"Allow delivery of PDF and ZIP files"**.
   - **Save**.

   Sin este paso, el visor de PDF del front no funcionará.

### 3. Variables de entorno

#### Backend — crea `.env` en la raíz del proyecto Backend

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

# Sólo si usas Docker para arrancar la app:
MONGO_CONTAINER_NAME=monger_things
MONGO_INTERNAL_PORT=27017

# ── Autenticación JWT ──
# IMPORTANTE: usa una cadena larga, aleatoria y secreta.
# Puedes generarla con:  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=cambia_esto_por_una_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=1d

# ── Cloudinary (almacenamiento de PDFs) ──
# Obtén estos valores en https://cloudinary.com → Dashboard
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=000000000000000
CLOUDINARY_API_SECRET=tu_api_secret_aqui

#ANTHROPIC
ANTHROPIC_API_KEY=
# ── CORS / Front ──
FRONTEND_URL=http://localhost:5173
```

⚠️ El archivo `.env` está en `.gitignore` y **no debe subirse a Git** bajo ningún concepto.

#### Front — crea `.env` en la raíz del proyecto Front

```env
VITE_API_URL=http://localhost:3001
```

### 4. Levantar la base de datos

Desde la carpeta del backend:

```bash
docker compose up -d mongo
```

Esto arranca MongoDB en segundo plano. Verifica que está corriendo:

```bash
docker compose ps
```

Deberías ver `monger_things` con estado `Up` y el puerto `0.0.0.0:27027->27017/tcp`.

**Conexión opcional desde MongoDB Compass:**
```
mongodb://Mike:TheCakeIsALie@localhost:27027/?authSource=admin
```

### 5. Arrancar el backend

```bash
npm run dev
```

Verás:

```
🔌 Conectando a: mongodb://Mike:***@localhost:27027/StrongerThingsDB?authSource=admin
✅ Conectado a MongoDB (StrongerThingsDB@localhost)
🚀 StrongerThings API en marcha en http://localhost:3001
```

### 6. Arrancar el front

En otra terminal:

```bash
cd Stronger-Things-Front
npm run dev
```

Abrirá automáticamente http://localhost:5173.

### 7. Promover usuario a administrador

El primer usuario debe promoverse a admin manualmente desde MongoDB:

**Opción A: con MongoDB Compass**

1. Conéctate con la URI de arriba.
2. Base de datos `StrongerThingsDB` → colección `users`.
3. Edita tu documento y cambia `role` de `"user"` a `"admin"`.
4. **Cierra sesión y vuelve a entrar** en el front para que se aplique.

**Opción B: con `mongosh`**

```bash
docker exec -it monger_things mongosh -u Mike -p TheCakeIsALie --authenticationDatabase admin

use StrongerThingsDB
db.users.updateOne(
    { email: "tu_email@dominio.com" },
    { $set: { role: "admin" } }
)
```

A partir de aquí podrás promover/degradar a otros desde el panel de admin de la UI.

---

## Endpoints

Todas las respuestas son JSON. Las rutas marcadas con 🔒 requieren cabecera:
```
Authorization: Bearer <token>
```

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

### Personajes

| Método | Ruta | Descripción |
|---|---|---|
| GET 🔒 | `/api/characters` | Personajes del usuario |
| POST 🔒 | `/api/characters` | Crear |
| GET 🔒 | `/api/characters/:id` | Detalle (populate user e inventory) |
| PUT 🔒 | `/api/characters/:id` | Actualizar |
| DELETE 🔒 | `/api/characters/:id` | Eliminar |

### Inventario

| Método | Ruta | Descripción |
|---|---|---|
| POST 🔒 | `/api/characters/:id/inventory` | Añadir item |
| PUT 🔒 | `/api/characters/:id/inventory/:itemId` | Actualizar item |
| DELETE 🔒 | `/api/characters/:id/inventory/:itemId` | Eliminar item |

### Hoja de personaje (PDF)

| Método | Ruta | Descripción |
|---|---|---|
| POST 🔒 | `/api/characters/:id/sheet` | Subir PDF (campo `sheet`, máx 50MB) |
| GET 🔒 | `/api/characters/:id/sheet` | Descargar (redirige a Cloudinary) |
| DELETE 🔒 | `/api/characters/:id/sheet` | Eliminar |

### Administración

| Método | Ruta | Descripción |
|---|---|---|
| GET 🔒👑 | `/api/admin/stats` | Estadísticas globales |
| GET 🔒👑 | `/api/admin/users` | Listar todos los usuarios |
| PUT 🔒👑 | `/api/admin/users/:id/role` | Cambiar rol de un usuario |
| DELETE 🔒👑 | `/api/admin/users/:id` | Eliminar usuario y todos sus personajes |

---

## Modelos

### User
```javascript
{ username, email, password_hash, role: "user" | "admin" }
```

### BaseObject (catálogo)
```javascript
{
    name, description, category, cost,
    stats: { damage, damageType, attackBonus, armorClass, weight,
             properties[], rarity, requiresAttunement, maxDurability }
}
```

### Character
```javascript
{
    user, name, charClass, race, level, gold,
    abilityScores: { strength, dexterity, constitution, intelligence, wisdom, charisma },
    hitPoints: { current, max },
    inventory: [{ baseObject, customName, quantity, durability, equipped, notes }],
    characterSheet: { filename, mimeType, size, uploadedAt, cloudinaryPublicId, cloudinaryUrl }
}
```

---

## Estructura de carpetas

```
Stronger-Things-Backend/
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
│   ├── index.js
│   └── seed.js                Pobla la base con datos de ejemplo
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

```
Stronger-Things-Front/
├── src/
│   ├── api/                  Clientes HTTP por feature
│   ├── components/           Header, modales, ProtectedRoute, AdminRoute
│   ├── context/              AuthContext, ThemeContext
│   ├── pages/                Login, Register, Characters, CharacterDetail, Objects, Admin
│   ├── styles/global.css     Tema D&D
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## Comandos útiles

### Backend

```bash
npm run dev          # arranca con nodemon (recarga al guardar)
npm start            # arranca en producción
npm run seed         # llena la base con datos de ejemplo
                     # (requiere que el backend esté corriendo en otra terminal)
```

### Front

```bash
npm run dev          # http://localhost:5173
npm run build        # genera dist/
npm run preview      # sirve dist/ en local
```

### Docker

```bash
docker compose up -d            # backend + mongo en background
docker compose up mongo -d      # solo mongo
docker compose logs -f app      # ver logs en vivo
docker compose down             # parar y limpiar
docker compose down -v          # también borra volúmenes (⚠️ datos)
```

---

## Errores frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `EAI_AGAIN monger_things` | El front usa el nombre del contenedor en local | `MONGO_HOST=localhost` en `.env` |
| `ECONNREFUSED 127.0.0.1:27017` | Mal puerto | `MONGO_PORT=27027` en `.env` (puerto expuesto) |
| `CORS error` en el navegador | CORS no instalado/configurado | `npm install cors` y `app.use(cors({ origin: "http://localhost:5173" }))` |
| `Faltan campos obligatorios` al crear personaje | El front envía algo distinto al esperado | Comprobar `validateBody([...])` en routes |
| PDF no se previsualiza | Cloudinary no permite entrega de PDFs | Settings → Security → Allow PDF delivery |
| `Cannot find package 'cloudinary'` | No instalado | `npm install cloudinary` |
| Storage mode aparece como `local` cuando debería ser drive/cloudinary | `dotenv.config()` cargado tarde | Crear `src/config/loadEnv.js` y hacer `import "./config/loadEnv.js"` como primera línea de `index.js` |

---

## Buenas prácticas aplicadas

- Variables de entorno cargadas en un módulo dedicado (`loadEnv.js`) que se importa antes que cualquier otro módulo.
- Lógica de negocio separada en `services/`, controladores delgados.
- Scoping por usuario: cada usuario solo ve y modifica sus propios personajes.
- Roles para autorización (`user`, `admin`).
- Manejo centralizado de errores en `middlewares/errorHandler.js`.
- `password_hash` nunca se envía al cliente (`toJSON` lo borra).
- Multer en memoria para evitar archivos huérfanos en disco.
- Cloudinary con `resource_type: "image"` para PDFs (permite previsualización inline).

---

## Licencia

ISC

---

## Autor

Jesús Cabado — [GitHub](https://github.com/Jesuscabado)
