# Assets de tiles — Editor de mapas

Este directorio contiene las imágenes PNG usadas en el editor de mapas tácticos.

## Estructura

```
tiles/
├── terrain/      Suelos, agua, hierba, lava…
├── walls/        Texturas de muros
├── furniture/    Puertas, mobiliario, cueva…
└── tokens/       Imágenes de criaturas para los tokens del mapa
```

## Convención de nombres

El campo `img` de cada entrada en `src/utils/tileCatalog.js` apunta al archivo:

```
/tiles/{carpeta}/{nombre}.png
```

El `id` del tile en el catálogo no tiene que coincidir con el nombre del archivo; es el campo `img` quien establece la ruta.

## Agregar un tile nuevo

1. Añade el PNG en la carpeta correspondiente (`terrain/`, `walls/` o `furniture/`).
2. En `src/utils/tileCatalog.js`, añade una entrada a `TILE_CATALOG`:

```js
{
  id:       "mi-tile",
  name:     "Nombre visible en la paleta",
  category: "terrain",          // "terrain" | "wall" | "furniture"
  color:    "#5a5a5a",          // color de fallback mientras carga
  img:      "/tiles/terrain/mi-tile.png",
  svg:      TILE_FLOOR_STONE    // SVG usado si la imagen no carga
}
```

3. Añade el `id` al array `VALID_TILE_IDS` en `server/src/services/mapService.js` para que la IA pueda usarlo.

## Agregar una imagen de token

1. Añade el PNG en `tiles/tokens/`.
2. En `src/utils/tileCatalog.js`, añade una entrada a `TOKEN_IMAGES`:

```js
{ id: "mi-criatura", name: "Mi criatura", img: "/tiles/tokens/mi-criatura.png" }
```

## Resolución recomendada

- **32 × 32 px** o múltiplos (64×64 para HiDPI).
- El editor escala todas las imágenes a `cellSize` (32 px por defecto).
- Usa `imageRendering: pixelated` para pixel art; el CSS ya lo aplica en la paleta.

## Licencia de los assets

Todos los assets de este directorio son **CC0 (dominio público)** — uso libre sin restricciones, incluyendo comercial.

### Fuentes

| Pack | Fuente | Licencia |
|---|---|---|
| Tiles de suelo, muros y mobiliario | [Kenney — Roguelike/RPG Pack](https://kenney.nl/assets/roguelike-rpg-pack) | CC0 |
| Tiles de mazmorra | [Kenney — Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) | CC0 |
| Tiles de cuevas | [Kenney — Roguelike Caves & Dungeons](https://kenney.nl/assets/roguelike-caves-dungeons) | CC0 |
| Tokens de criaturas | [game-icons.net](https://game-icons.net) | CC BY 3.0 / CC0 (varía por icono) |

> Para los tokens de game-icons.net con licencia **CC BY 3.0**, la atribución requerida es:  
> *Icons by Lorc, Delapouite and contributors — https://game-icons.net — CC BY 3.0*

No añadas assets con licencia CC BY-NC o similares restrictivas si el proyecto tiene uso comercial.
