# Memoria del proyecto StrongerThings

> Bitácora de la evolución, decisiones técnicas y aprendizajes durante el desarrollo del proyecto.

Esta memoria documenta el camino recorrido desde el proyecto base **mongo-Rol** hasta llegar a una aplicación full-stack con autenticación, almacenamiento en la nube y vista de administración. Cada hito recoge la motivación, las decisiones que se tomaron y los problemas reales que aparecieron en el camino.

---

## Índice

1. [Punto de partida](#1-punto-de-partida)
2. [Adaptación a D&D 5e](#2-adaptación-a-dd-5e)
3. [Dockerización y problemas de red](#3-dockerización-y-problemas-de-red)
4. [Autenticación con JWT y bcrypt](#4-autenticación-con-jwt-y-bcrypt)
5. [Vista de administrador y roles](#5-vista-de-administrador-y-roles)
6. [Subida de hojas de personaje](#6-subida-de-hojas-de-personaje)
7. [Front con React + Vite](#7-front-con-react--vite)
8. [Refactor: edición y operaciones avanzadas](#8-refactor-edición-y-operaciones-avanzadas)
9. [Limpieza, README y documentación](#9-limpieza-readme-y-documentación)
10. [Lecciones aprendidas](#10-lecciones-aprendidas)

---

## 1. Punto de partida

**Base:** proyecto académico `mongo-Rol`, una API simple de gestión de personajes con MongoDB y Mongoose.

**Estado inicial:**
- Express con un único modelo `Character` y otro `Object`.
- Sin autenticación. Sin separación entre lógica de negocio y controladores.
- Sin Docker, sin tests, sin documentación.

**Decisión:** usar mongo-Rol como esqueleto para construir un proyecto más ambicioso temáticamente: un gestor de personajes de **Dungeons & Dragons 5e** con todas las features que normalmente faltan en un proyecto académico (auth, roles, almacenamiento externo, front, deploy).

---

## 2. Adaptación a D&D 5e

### Decisiones de modelado

Los modelos genéricos del proyecto base no representaban bien las reglas reales del juego. Se rediseñaron para reflejar D&D 5e con fidelidad:

- **`User`**: nuevo. `username`, `email`, `password_hash` (luego `role`).
- **`BaseObject`**: catálogo compartido de objetos del juego. Stats típicos de D&D (`damage: "1d8"`, `armorClass`, `properties: ["versatile"]`, `rarity`, `requiresAttunement`).
- **`Character`**: ahora con `charClass` (enum de 13 clases), `race` (enum), `level` (max 20), `gold`, `abilityScores` (los 6 atributos clásicos: STR/DEX/CON/INT/WIS/CHA), `hitPoints` y un `inventory` como array de **documentos embebidos**.

### El patrón de inventario

Decisión clave: el inventario no almacena objetos completos, sino **instancias** que referencian al catálogo. Cada item tiene `baseObject` (ObjectId), `customName`, `quantity`, `durability`, `equipped`, `notes`. Ventajas:

- Un mismo objeto del catálogo (ej. "Espada Larga") puede ser instanciado N veces con stats personalizados (renombrada a "Andúril" con durabilidad 95).
- Si se actualiza el catálogo, los items existentes heredan los cambios.
- `populate()` resuelve la referencia cuando el cliente lo pide.

### Estructura de carpetas adoptada

Siguiendo principios de separación de responsabilidades:

```
src/
├── config/           Conexión a infraestructura
├── models/           Esquemas Mongoose
├── services/         Lógica de negocio pura (sin Express)
├── controllers/      Manejo HTTP/JSON
├── routes/           Definición de endpoints
└── middlewares/      Validaciones, auth, errores
```

Esta separación demostró ser muy útil más adelante: cuando se cambió de almacenamiento local a Cloudinary, sólo hubo que tocar el `service` correspondiente, no los controladores.

---

## 3. Dockerización y problemas de red

Se añadió Docker Compose con dos servicios: `app` y `mongo`. **Aquí aparecieron las primeras dificultades reales del proyecto.**

### Problema 1: hostnames distintos según el entorno

Dentro de Docker, los contenedores se hablan por nombre de servicio (`mongo` o `monger_things`). Pero cuando se ejecuta `npm run dev` desde la máquina host, ese nombre no se resuelve — hay que usar `localhost`.

**Error típico:** `EAI_AGAIN monger_things` al hacer `npm run dev`.

**Solución adoptada:** sobrescribir las variables en el bloque `environment:` del `docker-compose.yml`. Así el `.env` queda configurado para desarrollo local, y Docker pisa lo necesario al levantar el stack.

```yaml
environment:
  MONGO_HOST: monger_things   # nombre del contenedor (sólo dentro de Docker)
  MONGO_PORT: 27017           # puerto interno de Mongo
```

### Problema 2: puertos internos vs expuestos

Otra fuente de confusión. Docker mapea `27027:27017` — el primero es el del host, el segundo el interno. Resumen:

| Dónde corre | `MONGO_HOST` | `MONGO_PORT` |
|---|---|---|
| Dentro de Docker | `monger_things` | `27017` |
| `npm run dev` en host | `localhost` | `27027` |

### Problema 3: el orden de carga de `dotenv`

Este fue de los más sutiles y costosos del proyecto. El error: aunque el `.env` tenía las variables correctas, dentro del código aparecían como `undefined`.

Causa: en ES Modules, los `import` se evalúan **antes** que el código del archivo. Si `dotenv.config()` está en línea 5 pero `import "./config/upload.js"` está en línea 4, cuando `upload.js` lee `process.env.X` aún no ha corrido `dotenv`.

**Solución definitiva:** mover la carga de dotenv a su propio módulo y hacer que sea el **primer import** del entry point:

```javascript
// src/config/loadEnv.js
import dotenv from "dotenv";
dotenv.config();
```

```javascript
// src/index.js
import "./config/loadEnv.js";   // PRIMERA línea — carga el .env antes que nada

import express from "express";
// resto de imports...
```

Este patrón es el que se ve en proyectos serios con ESM. **Aprendizaje importante** que vale para cualquier proyecto Node con módulos ES.

---

## 4. Autenticación con JWT y bcrypt

Se añadió un sistema de autenticación completo:

- **`/api/auth/register`** — crea usuario, hashea password con bcrypt (10 rounds), devuelve token.
- **`/api/auth/login`** — verifica credenciales y devuelve `{ user, token }`.
- **`/api/auth/me`** — endpoint protegido para obtener el usuario actual.

### Middleware `authRequired`

Lee la cabecera `Authorization: Bearer <token>`, verifica el JWT, busca el usuario en la base y lo deja en `req.user` para los handlers siguientes. Errores 401 con mensajes diferenciados (token ausente, inválido, expirado).

### Scoping por usuario

Una vez había auth, cada personaje pasó a estar **vinculado a su creador**. Las queries se filtran por `req.user._id`:

```javascript
Character.find({ user: userId })
```

Con `403 Forbidden` si alguien intenta acceder a un personaje ajeno (`character.user.toString() !== userId.toString()`).

### Lección de seguridad: nunca exponer el hash

Aprendizaje sutil pero importante. Se sobreescribió `toJSON` en el modelo `User`:

```javascript
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password_hash;
    return obj;
};
```

Así, aunque cualquier endpoint devuelva un user, el cliente nunca recibe el hash.

---

## 5. Vista de administrador y roles

Se añadió un sistema de roles (`user` / `admin`) y una vista exclusiva para admins.

### Backend

- Campo `role` en el modelo `User`, con default `"user"`.
- Middleware `adminRequired` que comprueba `req.user.role === "admin"`.
- Endpoints en `/api/admin/*`: estadísticas, listar usuarios, cambiar rol, eliminar usuario.
- **Borrado en cascada:** al eliminar un user se borran todos sus personajes (`Character.deleteMany({ user: id })`).

### Frontend

- Componente `<AdminRoute>` que redirige a `/characters` si el usuario no es admin.
- Página `/admin` con tabla de usuarios, botones de promover/degradar/eliminar y panel de estadísticas.
- Enlace "⚜ Admin" en el header solo visible para admins.

### El primer admin

No se puede crear el primer admin desde la API (no hay nadie con permisos para hacerlo). Solución: promoverse manualmente desde MongoDB Compass o `mongosh` la primera vez. A partir de ahí, los siguientes se pueden gestionar desde la UI.

---

## 6. Subida de hojas de personaje

La feature más turbulenta del proyecto. Pasamos por **tres iteraciones** antes de quedarnos con la solución final.

### Iteración 1: almacenamiento local

`multer.diskStorage` guardando los PDFs en `uploads/character-sheets/` con UUID como nombre. Funcional pero limitado: los archivos no sobreviven a un `docker compose down -v` y no son accesibles desde fuera.

### Iteración 2: Google Drive con Service Account

Tema bonito sobre el papel: usar la API de Google Drive con una Service Account y subir los archivos a una carpeta compartida.

**Setup:** crear proyecto en Google Cloud, activar Drive API, crear Service Account, descargar JSON de credenciales, compartir la carpeta de Drive con el email de la SA.

**El error definitivo:**
```
Service Accounts do not have storage quota.
Leverage shared drives, or use OAuth delegation instead.
```

Google cambió su política y las Service Accounts ya **no pueden crear archivos en Drive personal**, sólo en Shared Drives (que requieren Workspace de pago) o usando OAuth delegation (más complejo).

Aprendizaje involuntario: aunque tengas permiso de Editor en una carpeta, sin **cuota propia de almacenamiento** Google rechaza la creación.

### Iteración 3: Cloudinary (la definitiva)

Cambio de proveedor a Cloudinary. Plan gratuito generoso (25 GB), API simple, soporte nativo de PDFs.

**Setup minimalista:**
- Cuenta gratuita (sin tarjeta).
- Tres credenciales (`cloud_name`, `api_key`, `api_secret`).
- Activar entrega de PDFs en Settings → Security.

**Cambios en código mínimos** gracias a la separación en services. Multer pasó a `memoryStorage()` (recibe buffer), `cloudinaryService.js` lo sube via `upload_stream`, y se almacena en BD el `cloudinaryUrl` para descargas futuras.

Para que el PDF se sirviera **inline en lugar de descargar**, hubo que subirlo como `resource_type: "image"` con `format: "pdf"` (Cloudinary trata así los PDFs como imagen vectorial). Permite previsualizarlo en un `<iframe>`.

### Lecciones de esta saga

1. **Las APIs gratuitas tienen letra pequeña.** Lee siempre la política antes de invertir setup.
2. **La arquitectura limpia paga.** Cambiar de Drive a Cloudinary fue cuestión de reescribir un único service. Los controladores y rutas no se tocaron.
3. **Saber cuándo abandonar.** Tras dos horas peleando con Service Accounts, el cambio a Cloudinary fue cuestión de 30 minutos.

### Coletilla: incidente de seguridad

Durante la fase de Drive, el archivo `google-credentials.json` se commiteó accidentalmente. GitHub lo detectó y bloqueó el push con su sistema de secret scanning.

**Resolución:**
- Se revocó la Service Account inmediatamente en Google Cloud.
- Se reescribió el historial con `git filter-repo --invert-paths --path google-credentials.json`.
- Se hizo `force push`.
- Lección: **GitHub tiene secret scanning activo**, lo cual es genial.

---

## 7. Front con React + Vite

Tras tener un backend completo, llegó el front.

### Decisiones técnicas

- **React + Vite** sobre HTML/JS vanilla por: hot reload, componentes, routing, state management con hooks.
- **Sin framework UI** (Material-UI, Chakra, etc.): CSS propio con tema D&D personalizado. Quería una estética con identidad ("pergamino") en vez de una app más con cards genéricas.
- **Fetch nativo**, no Axios: una dependencia menos. Wrappers simples en `api/client.js`.
- **Context API** para auth (no Redux ni Zustand): el estado es pequeño y no compensa la complejidad.

### Estética: dos temas

- **Pergamino** (light): paleta crema/sepia/oro, fuente Cinzel + EB Garamond + MedievalSharp.
- **Dungeon** (dark): paleta negro/dorado tenue, mismas tipografías.

Toggle en el header. Persistencia con `localStorage`. Variables CSS por `data-theme="..."` en el `<html>`.

### CORS

Primer obstáculo del front: el navegador bloqueaba las peticiones a `localhost:3001` desde `localhost:5173`. Solución: instalar `cors` en el backend con la URL del front en el origin permitido.

```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
```

---

## 8. Refactor: edición y operaciones avanzadas

Una vez lo básico funcionaba, se añadieron features de calidad de vida.

### Edición inline

Click sobre cualquier número del personaje (PG, oro, nivel, atributos) → input editable → Enter guarda, Esc cancela. Componente `<EditableNumber>` reutilizable, basado en estado local + onSave callback.

Detalle UX: los valores tienen un subrayado punteado para indicar que son editables. Es la convención de "click para editar" sin gritarle al usuario.

### Operaciones del inventario

Al principio sólo se podían añadir/quitar items y equipar/desequipar. Se añadieron:

- **Slider de durabilidad** en tiempo real.
- **Modal de edición completo** con todos los campos del item (cantidad, customName, durabilidad, equipped, notes).
- **Sub-rutas en el backend:** `PUT /api/characters/:id/inventory/:itemId` y `DELETE` equivalente.

### Visor de PDF

Modal con `<iframe>` que carga la URL de Cloudinary directamente. La key fue subir el PDF con `resource_type: "image"` para que Cloudinary lo sirviera inline.

### Aumento del límite de tamaño

Pasó de 5 MB a 50 MB. Se ajustaron tres sitios: Multer (`limits.fileSize`), Express (`express.json({ limit: ... })`) y el mensaje de error en el handler.

---

## 9. Limpieza, README y documentación

Última fase: dejar el proyecto presentable.

- README completo con setup paso a paso, incluyendo la creación de cuenta en Cloudinary.
- `.env.example` con valores ficticios para que cualquiera pueda clonar y arrancar.
- Esta MEMORIA.md.
- Limpieza de archivos sin uso (script `test.js` heredado del base, restos de Drive).
- `.gitignore` repasado: `node_modules/`, `.env`, `uploads/` (por si acaso), `google-credentials.json`.

---

## 10. Lecciones aprendidas

### Sobre la arquitectura

- **La separación service/controller/routes paga muy rápido**. Cualquier cambio de infraestructura (ej. Drive → Cloudinary) toca un sólo archivo.
- **Los middlewares son tu amigo.** `authRequired`, `adminRequired`, `validateBody`, `validateObjectId` aplicados con `router.use(...)` ahorran muchísimo código.
- **Usa `enum` siempre que sea posible** en Mongoose. Pillar errores de tipeo antes de que lleguen a base.

### Sobre Node.js y ES Modules

- **El orden de imports importa.** Si un import lee `process.env`, asegúrate de cargar dotenv ANTES, idealmente en su propio módulo.
- **`process.env.X` siempre llega como string.** `=== "true"`, no `=== true`. Las flags booleanas en `.env` son strings.
- **`--env-file=.env` de Node 20+** es una alternativa a dotenv. Útil para scripts puntuales.

### Sobre Docker

- **Las variables del `.env` no se pasan automáticamente al contenedor.** Hay que ponerlas en el bloque `environment:` del compose.
- **`depends_on` no espera a que el servicio esté listo**, sólo a que el contenedor exista. Para esperas reales, usar healthchecks o un retry en el cliente.
- **Los volúmenes nombrados** (`mongo_data`) sobreviven a `docker compose down`, no a `down -v`. Cuidado al limpiar.

### Sobre seguridad

- **Nunca commitear secretos.** Aunque el repo sea privado.
- **Si pasa, revocar primero, reescribir historial después.** El historial reescrito no devuelve la clave a su estado seguro — sólo la quita del repo.
- **GitHub Secret Scanning funciona.** Mejor confiar en él como red de seguridad.
- **Las Service Accounts de Google no son la solución para todo.** Para Drive personal hay limitaciones de cuota que no son obvias.

### Sobre el desarrollo en sí

- **El copy-paste desde un chat puede romper código.** Los enlaces Markdown se quedan pegados (`[process.env.X](http://process.env.X)` en lugar de `process.env.X`). Mejor descargar archivos planos o teclear a mano las líneas críticas.
- **Iterar pequeño, validar pronto.** Cada feature se probó en Postman antes de añadir UI.
- **Saber cuándo cambiar de enfoque.** Insistir con Drive cuando Cloudinary era 10× más simple no habría aportado nada al proyecto.

---