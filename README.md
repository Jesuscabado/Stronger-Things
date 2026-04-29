# StrongerThings

> API RESTful en Node.js para gestión de personajes e inventarios siguiendo las reglas de **Dungeons & Dragons 5e**. Cada usuario gestiona sus propios personajes, su catálogo compartido de objetos y puede adjuntar la hoja de personaje en PDF.

## Stack

- **Node.js** (ES Modules)
- **Express 5**
- **MongoDB 7** + **Mongoose 8**
- **JWT** + **bcrypt** para autenticación
- **Multer** para subida de archivos
- **Docker Compose** para entorno local

## Estructura

```
src/
├── config/
│   ├── db.js              Conexión a MongoDB
│   └── upload.js          Configuración de Multer
├── controllers/           Manejo HTTP/JSON
├── middlewares/           Auth JWT, validaciones, errores
├── models/                Esquemas Mongoose
├── routes/                Definición de endpoints
├── services/              Lógica de negocio pura
├── index.js               Punto de entrada
└── seed.js                Script para poblar la base
uploads/character-sheets/  PDFs subidos (gitignored)
```

## Instalación

```bash
git clone https://github.com/Jesuscabado/Stronger-Things-Backend.git
cd Stronger-Things-Backend
npm install
cp .env.example .env       # ajusta las variables
```

### Variables de entorno (`.env`)

```env
APP_HOST=StrongerThings
APP_PORT=3001

MONGO_HOST=localhost
MONGO_PORT=27027
MONGO_USER=Mike
MONGO_PASSWORD=TheCakeIsALie
MONGO_DB=StrongerThingsDB

JWT_SECRET=cambia_esto_por_algo_largo
JWT_EXPIRES_IN=1d
```

## Arrancar

### Con Docker (recomendado)

```bash
docker compose up --build
```

La API queda en `http://localhost:3001`.

### En local (Mongo en Docker, app en tu máquina)

```bash
docker compose up -d mongo
npm run dev
```

### Poblar con datos de ejemplo

```bash
npm run seed
```

Crea un usuario `dm@dnd.io` / `secret123`, varios objetos y 4 personajes con inventario.

## Endpoints

Todas las rutas devuelven JSON. Las protegidas requieren cabecera:

```
Authorization: Bearer <token>
```

### Auth

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Registro. Body: `{ username, email, password }`. Devuelve `{ user, token }` |
| POST | `/api/auth/login` | ❌ | Login. Body: `{ email, password }`. Devuelve `{ user, token }` |
| GET | `/api/auth/me` | ✅ | Devuelve el usuario actual |

### Catálogo de objetos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/objects` | ❌ | Lista todo el catálogo |
| GET | `/api/objects/:id` | ❌ | Detalle de un objeto |
| POST | `/api/objects` | ✅ | Crea un objeto del catálogo |
| PUT | `/api/objects/:id` | ✅ | Actualiza un objeto |
| DELETE | `/api/objects/:id` | ✅ | Elimina un objeto |

### Personajes

Cada usuario solo ve y modifica los suyos.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/characters` | Lista los personajes del usuario |
| GET | `/api/characters/:id` | Detalle (con `populate` de user e inventory) |
| POST | `/api/characters` | Crea un personaje |
| PUT | `/api/characters/:id` | Actualiza el personaje |
| DELETE | `/api/characters/:id` | Elimina el personaje |

### Inventario

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/characters/:id/inventory` | Añade item. Body: `{ baseObject, customName?, durability?, quantity?, equipped?, notes? }` |
| PUT | `/api/characters/:id/inventory/:itemId` | Actualiza item (durabilidad, equipped, etc.) |
| DELETE | `/api/characters/:id/inventory/:itemId` | Elimina item del inventario |

### Hoja de personaje (PDF)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/characters/:id/sheet` | Sube PDF (multipart/form-data, campo `sheet`, máx 5MB) |
| GET | `/api/characters/:id/sheet` | Descarga el PDF |
| DELETE | `/api/characters/:id/sheet` | Elimina el PDF asociado |

## Ejemplos

### Registro y login

```bash
# Registro
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"DM","email":"dm@dnd.io","password":"secret123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dm@dnd.io","password":"secret123"}'
```

### Crear personaje

```bash
TOKEN="..."
curl -X POST http://localhost:3001/api/characters \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aragorn",
    "charClass": "Ranger",
    "race": "Human",
    "level": 5
  }'
```

### Subir hoja de personaje

```bash
curl -X POST http://localhost:3001/api/characters/<id>/sheet \
  -H "Authorization: Bearer $TOKEN" \
  -F "sheet=@./aragorn.pdf"
```

### Descargar hoja

```bash
curl -X GET http://localhost:3001/api/characters/<id>/sheet \
  -H "Authorization: Bearer $TOKEN" \
  -o aragorn.pdf
```

### Equipar/desequipar item

```bash
curl -X PUT http://localhost:3001/api/characters/<id>/inventory/<itemId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"equipped": true, "durability": 87}'
```

## Modelos

### User

```javascript
{ username, email, password_hash, timestamps }
```

### BaseObject

```javascript
{
  name, description, category, cost,
  stats: { damage, damageType, attackBonus, armorClass, weight,
           properties[], rarity, requiresAttunement, maxDurability, extra }
}
```

### Character

```javascript
{
  user, name, charClass, race, level, gold,
  abilityScores: { strength, dexterity, constitution, intelligence, wisdom, charisma },
  hitPoints: { current, max },
  inventory: [{ baseObject, customName, quantity, durability, equipped, notes }],
  characterSheet: { filename, storedName, mimeType, size, uploadedAt }
}
```

## Almacenamiento de archivos

Los PDFs se guardan en `./uploads/character-sheets/` con un UUID como nombre interno. El nombre original se preserva en la base de datos para que la descarga lo recupere correctamente.

Para producción se recomienda migrar a almacenamiento externo (S3, Google Drive, Cloudinary). El service `attachCharacterSheet` está aislado: cambiar el destino solo afecta a `src/config/upload.js` y a la lógica de `getCharacterSheetPath`.

## Códigos de error

| Código | Significado |
|---|---|
| 400 | Validación, body inválido, archivo no permitido |
| 401 | No autenticado o token expirado |
| 403 | Recurso de otro usuario |
| 404 | Recurso no encontrado |
| 500 | Error interno |

## Licencia

ISC