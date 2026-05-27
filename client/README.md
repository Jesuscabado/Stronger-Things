# StrongerThings — Frontend

Aplicación React 18 construida con Vite. Interfaz para gestión de partidas D&D 5e: personajes, campañas, sesiones, bestiario, catálogo de objetos y hechizos, diario y editor de mapas tácticos.

---

## Setup

```bash
cd client
cp .env.example .env       # Ajusta VITE_API_URL si el backend no está en localhost:3001
npm install --legacy-peer-deps
npm run dev                # http://localhost:5173
```

> `--legacy-peer-deps` es necesario por la compatibilidad de `react-konva@18` con React 18.

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:3001` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth Google (opcional) | — |

Tras editar `client/.env`, reinicia el dev server.

---

## Comandos

```bash
npm run dev       # Dev server con HMR
npm run build     # Build de producción → dist/
npm run preview   # Previsualiza el build
```

---

## Rutas de la aplicación

| Ruta | Componente | Acceso |
|---|---|---|
| `/login` | LoginPage | Público |
| `/register` | RegisterPage | Público |
| `/characters` | CharactersPage | Autenticado |
| `/characters/:id` | CharacterDetailPage | Propietario |
| `/characters/:id/print` | CharacterSheetPrint | Propietario |
| `/campaigns` | CampaignsPage | DM |
| `/sessions` | SessionsPage | DM |
| `/bestiary` | BestiaryPage | DM |
| `/objects` | ObjectsPage | Autenticado |
| `/spells` | SpellsPage | Autenticado |
| `/diary` | DiaryPage | Autenticado |
| `/maps` | MapsPage | Feature `maps` o admin |
| `/maps/new` | MapEditorPage | Feature `maps` o admin |
| `/maps/:id/edit` | MapEditorPage | Feature `maps` o admin |
| `/account` | AccountPage | Autenticado |
| `/admin` | AdminPage | Admin |

---

## Editor de mapas

El editor (`MapEditorPage.jsx`) usa **react-konva** para renderizar un canvas de 4 capas:

| Capa | Contenido |
|---|---|
| Terrain | `Rect` (color) o `KonvaImage` (PNG) por celda |
| Grid | Líneas de cuadrícula semitransparentes |
| Walls | Segmentos de pared personalizados |
| Tokens | Fichas arrastrables con imagen circular opcional |

### Tiles

Los tiles se definen en `src/utils/tileCatalog.js`. Cada entrada tiene:
- `id` — identificador único (debe coincidir con el nombre del archivo PNG sin extensión en el path `img`)
- `name` — etiqueta en la UI
- `category` — `"terrain"` | `"wall"` | `"furniture"`
- `color` — color de fallback mientras carga la imagen
- `img` (opcional) — ruta relativa a `/public` (e.g. `/tiles/terrain/floor-grass.png`)
- `svg` — SVG placeholder si no hay `img`

Los archivos PNG van en `public/tiles/{category}/{nombre}.png`.

### Imágenes de token

Definidas en `TOKEN_IMAGES` (también en `tileCatalog.js`). Se almacenan en `public/tiles/tokens/`. La imagen se guarda como ruta string en `token.tokenImg` y se muestra recortada en círculo sobre el token.

### Generación con IA

`POST /api/maps/generate` llama a **Claude Sonnet** con un prompt estructurado que incluye reglas de zonificación, tipos de tiles válidos y esquema de respuesta JSON. El resultado se carga en el editor sin guardarse; el usuario puede retocar y guardar manualmente.

El prompt y el estilo se guardan en `map.aiMeta` para poder regenerar partiendo de la misma base.

---

## Estructura de carpetas

```
client/src/
├── api/                  Clientes HTTP por recurso (fetch wrapper)
│   ├── client.js         Wrapper base con interceptor de auth
│   ├── auth.js
│   ├── characters.js
│   ├── objects.js
│   ├── monsters.js
│   ├── spells.js
│   ├── sessions.js
│   ├── campaigns.js
│   ├── maps.js
│   └── admin.js
├── components/
│   ├── layout/           Header, Footer, ProtectedRoute, AdminRoute, Tabs…
│   ├── ui/               ErrorBoundary, Toast, PDFPreviewModal…
│   └── character/        Secciones del editor de personaje (pestañas)
├── context/
│   ├── AuthContext.jsx   JWT + perfil de usuario (sincronizado con /api/auth/me)
│   ├── ThemeContext.jsx  Tema claro/oscuro (localStorage)
│   └── ToastContext.jsx  Notificaciones globales
├── pages/                Un componente por ruta
├── utils/
│   ├── tileCatalog.js    Definición de tiles y TOKEN_IMAGES
│   ├── dndCalc.js        Cálculos de modificadores, dados, etc.
│   ├── dndLabels.js      Traducciones de enumerados D&D
│   └── categoryLabels.js Etiquetas de categorías de objetos
└── App.jsx               Definición de rutas con React Router 6

client/public/
└── tiles/
    ├── terrain/          PNGs de suelos y agua
    ├── walls/            PNGs de muros
    ├── furniture/        PNGs de mobiliario y puertas
    └── tokens/           PNGs de criaturas para tokens
```

---

## Compatibilidad

- React 18.x
- Vite 5.x
- react-konva 18.x (requiere `--legacy-peer-deps` — la versión 19 exige React 19)
- Navegadores modernos con soporte ES2020+ y Canvas API
