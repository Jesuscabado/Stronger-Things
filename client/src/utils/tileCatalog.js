/**
 * Catálogo de tiles del editor de mapas tácticos.
 *
 * Cada entrada: { id, name, category, color, svg, img? }
 *   - id       identificador único usado en terrain[][] y en el servidor
 *   - name     etiqueta legible para la UI
 *   - category agrupación en la paleta ("terrain" | "wall" | "furniture")
 *   - color    color de fallback para minimap y mientras carga la imagen
 *   - img      (opcional) ruta relativa a /public — se usa si el archivo existe
 *   - svg      SVG placeholder 32×32 usado cuando no hay img o mientras carga
 */

// SVG helpers ─────────────────────────────────────────────────────────────────

const svg = (body) =>
    `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'>${body}</svg>`;

const rect = (x, y, w, h, fill, extra = "") =>
    `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${fill}'${extra ? " " + extra : ""}/>`;

const line = (x1, y1, x2, y2, stroke, sw = 1) =>
    `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='${stroke}' stroke-width='${sw}'/>`;

const text = (t, x, y, fill = "#fff", size = 14) =>
    `<text x='${x}' y='${y}' font-size='${size}' fill='${fill}' text-anchor='middle' font-family='sans-serif'>${t}</text>`;

// ─── SVG placeholders ─────────────────────────────────────────────────────────

const TILE_FLOOR_STONE = svg(
    rect(0, 0, 32, 32, "#5a5a5a") +
    line(0, 16, 32, 16, "#484848", 0.5) +
    line(16, 0, 16, 32, "#484848", 0.5) +
    `<rect x='0.5' y='0.5' width='31' height='31' fill='none' stroke='#404040' stroke-width='0.5'/>`
);

const TILE_FLOOR_WOOD = svg(
    rect(0, 0, 32, 32, "#7a5230") +
    line(0, 11, 32, 11, "#5c3a20", 1) +
    line(0, 22, 32, 22, "#5c3a20", 1) +
    line(16, 0, 16, 11, "#5c3a20", 0.5) +
    line(8, 11, 8, 22, "#5c3a20", 0.5) +
    line(24, 22, 24, 32, "#5c3a20", 0.5)
);

const TILE_FLOOR_GRASS = svg(
    rect(0, 0, 32, 32, "#4a7c3f") +
    `<circle cx='6'  cy='8'  r='2' fill='#3d6b33'/>` +
    `<circle cx='22' cy='18' r='2' fill='#3d6b33'/>` +
    `<circle cx='14' cy='26' r='2' fill='#3d6b33'/>` +
    `<circle cx='26' cy='6'  r='1.5' fill='#5a9e4e'/>`
);

const TILE_FLOOR_DIRT = svg(
    rect(0, 0, 32, 32, "#8b7355") +
    `<circle cx='8'  cy='10' r='1.5' fill='#6e5b40'/>` +
    `<circle cx='20' cy='6'  r='1'   fill='#6e5b40'/>` +
    `<circle cx='25' cy='22' r='1.5' fill='#6e5b40'/>` +
    `<circle cx='5'  cy='25' r='1'   fill='#6e5b40'/>` +
    `<circle cx='15' cy='18' r='1'   fill='#a08860'/>`
);

const TILE_WATER = svg(
    rect(0, 0, 32, 32, "#1e6b9e") +
    `<path d='M0 12 Q8 8 16 12 Q24 16 32 12' fill='none' stroke='#5aaedc' stroke-width='1.5'/>` +
    `<path d='M0 22 Q8 18 16 22 Q24 26 32 22' fill='none' stroke='#5aaedc' stroke-width='1.5'/>`
);

const TILE_LAVA = svg(
    rect(0, 0, 32, 32, "#7a1e00") +
    `<path d='M4 32 Q8 20 14 28 Q18 16 22 24 Q26 12 32 20 L32 32Z' fill='#cc4400'/>` +
    `<circle cx='10' cy='22' r='3' fill='#ff7020' opacity='0.7'/>` +
    `<circle cx='22' cy='26' r='2' fill='#ff9040' opacity='0.6'/>`
);

const TILE_WALL_STONE = svg(
    rect(0, 0, 32, 32, "#2d2d2d") +
    `<rect x='0.5' y='0.5' width='31' height='31' fill='none' stroke='#404040' stroke-width='1'/>` +
    `<circle cx='16' cy='16' r='4' fill='#222222'/>` +
    line(4, 4, 10, 4, "#404040", 0.5) +
    line(4, 28, 10, 28, "#404040", 0.5)
);

const TILE_WALL_BRICK = svg(
    rect(0, 0, 32, 32, "#4a3728") +
    line(0, 8, 32, 8, "#2e1e12", 1) +
    line(16, 0, 16, 8, "#2e1e12", 1) +
    line(0, 16, 32, 16, "#2e1e12", 1) +
    line(8, 8, 8, 16, "#2e1e12", 1) +
    line(24, 8, 24, 16, "#2e1e12", 1) +
    line(0, 24, 32, 24, "#2e1e12", 1) +
    line(16, 16, 16, 24, "#2e1e12", 1) +
    line(8, 24, 8, 32, "#2e1e12", 1) +
    line(24, 24, 24, 32, "#2e1e12", 1)
);

const TILE_DOOR = svg(
    rect(0, 0, 32, 32, "#5a5a5a") +
    rect(6, 2, 20, 28, "#6b4226") +
    rect(7, 3, 18, 26, "#7a5230") +
    line(6, 16, 26, 16, "#5c3a20", 1) +
    `<circle cx='22' cy='16' r='2' fill='#daa520'/>`
);

const TILE_STAIRS_UP = svg(
    rect(0, 0, 32, 32, "#5a5a5a") +
    rect(4, 22, 24, 6, "#888") +
    rect(7, 16, 18, 6, "#999") +
    rect(10, 10, 12, 6, "#aaa") +
    rect(13, 4, 6, 6, "#bbb") +
    text("↑", 16, 31, "#ffffff", 10)
);

const TILE_STAIRS_DOWN = svg(
    rect(0, 0, 32, 32, "#5a5a5a") +
    rect(13, 2, 6, 6, "#888") +
    rect(10, 8, 12, 6, "#777") +
    rect(7, 14, 18, 6, "#666") +
    rect(4, 20, 24, 6, "#555") +
    text("↓", 16, 31, "#cccccc", 10)
);

const TILE_CHEST = svg(
    rect(0, 0, 32, 32, "#5a5a5a") +
    rect(4, 10, 24, 16, "#6b4226") +
    rect(4, 10, 24, 6, "#7a5230") +
    line(4, 16, 28, 16, "#5c3a20", 1) +
    rect(13, 14, 6, 4, "#daa520") +
    `<circle cx='16' cy='16' r='1.5' fill='#8b6000'/>`
);

const TILE_TABLE = svg(
    rect(0, 0, 32, 32, "#5a5a5a") +
    rect(4, 10, 24, 12, "#7a5230") +
    rect(5, 11, 22, 10, "#8b6640") +
    rect(5, 22, 4, 8, "#6b4226") +
    rect(23, 22, 4, 8, "#6b4226")
);

const TILE_BED = svg(
    rect(0, 0, 32, 32, "#5a5a5a") +
    rect(4, 6, 24, 22, "#6b4226") +
    rect(5, 7, 22, 20, "#8b6640") +
    rect(5, 7, 22, 8, "#e8d5b7") +
    line(5, 15, 27, 15, "#c4b090", 0.5)
);

const TILE_ALTAR = svg(
    rect(0, 0, 32, 32, "#5a5a5a") +
    rect(4, 20, 24, 10, "#444") +
    rect(8, 10, 16, 12, "#3a3a3a") +
    rect(10, 8, 12, 4, "#555") +
    line(16, 4, 16, 14, "#daa520", 1.5) +
    line(12, 8, 20, 8, "#daa520", 1.5)
);

// ─── Catálogo ─────────────────────────────────────────────────────────────────

export const TILE_CATALOG = [
    // ── Terrain ──
    { id: "floor-stone",                   name: "Suelo de piedra",          category: "terrain",   color: "#5a5a5a", svg: TILE_FLOOR_STONE },
    { id: "floor-stone-basic",             name: "Suelo de piedra liso",     category: "terrain",   color: "#5a5a5a", img: "/tiles/terrain/floor-stone-basic.png",             svg: TILE_FLOOR_STONE },
    { id: "floor-stone-details",           name: "Suelo de piedra detallado",category: "terrain",   color: "#606060", img: "/tiles/terrain/floor-stone-details.png",           svg: TILE_FLOOR_STONE },
    { id: "floor-wood",                    name: "Suelo de madera",          category: "terrain",   color: "#7a5230", svg: TILE_FLOOR_WOOD  },
    { id: "floor-grass",                   name: "Hierba",                   category: "terrain",   color: "#4a7c3f", img: "/tiles/terrain/floor-grass.png",                   svg: TILE_FLOOR_GRASS },
    { id: "floor-grass-stones",            name: "Hierba con piedras",       category: "terrain",   color: "#4a7c3f", img: "/tiles/terrain/floor-grass-stones.png",            svg: TILE_FLOOR_GRASS },
    { id: "floor-dirt",                    name: "Tierra",                   category: "terrain",   color: "#8b7355", svg: TILE_FLOOR_DIRT  },
    { id: "floor-terrain",                 name: "Terreno natural",          category: "terrain",   color: "#7a6040", img: "/tiles/terrain/floor-terrain.png",                 svg: TILE_FLOOR_DIRT  },
    { id: "water",                         name: "Agua",                     category: "terrain",   color: "#1e6b9e", img: "/tiles/terrain/floor-water.png",                   svg: TILE_WATER       },
    { id: "floor-water-tierra-arriba",     name: "Agua (costa N)",           category: "terrain",   color: "#1e6b9e", img: "/tiles/terrain/floor-water-tierra-arriba.png",     svg: TILE_WATER       },
    { id: "floor-water-tierra-arriba-dcha",name: "Agua (costa NE)",          category: "terrain",   color: "#1e6b9e", img: "/tiles/terrain/floor-water-tierra-arriba-dcha.png",svg: TILE_WATER       },
    { id: "floor-water-tierra-arriba-izq", name: "Agua (costa NO)",          category: "terrain",   color: "#1e6b9e", img: "/tiles/terrain/floor-water-tierra-arriba-izq.png", svg: TILE_WATER       },
    { id: "lava",                          name: "Lava",                     category: "terrain",   color: "#cc4400", svg: TILE_LAVA        },
    // ── Walls ──
    { id: "wall-stone",      name: "Muro de piedra",        category: "wall",      color: "#2d2d2d", img: "/tiles/walls/wall-stone.png",  svg: TILE_WALL_STONE },
    { id: "wall-brick",      name: "Muro de ladrillo",      category: "wall",      color: "#4a3728", img: "/tiles/walls/brick-wall.png",  svg: TILE_WALL_BRICK },
    { id: "muro-piedra",     name: "Muro de piedra grueso", category: "wall",      color: "#2a2a2a", img: "/tiles/furniture/stone_wall.png", svg: TILE_WALL_STONE },
    // ── Furniture ──
    { id: "door",            name: "Puerta de madera",      category: "furniture", color: "#6b4226", img: "/tiles/furniture/wood-door.png",     svg: TILE_DOOR       },
    { id: "puerta-piedra",   name: "Puerta de piedra",      category: "furniture", color: "#4a4a4a", img: "/tiles/furniture/puerta-piedra.png", svg: TILE_DOOR       },
    { id: "stairs-up",       name: "Escaleras ↑",           category: "furniture", color: "#888888", svg: TILE_STAIRS_UP   },
    { id: "stairs-down",     name: "Escaleras ↓",           category: "furniture", color: "#555555", svg: TILE_STAIRS_DOWN },
    { id: "chest",           name: "Cofre",                 category: "furniture", color: "#6b4226", svg: TILE_CHEST       },
    { id: "table",           name: "Mesa",                  category: "furniture", color: "#7a5230", img: "/tiles/furniture/mesa.png", svg: TILE_TABLE },
    { id: "bed",             name: "Cama",                  category: "furniture", color: "#8b6640", svg: TILE_BED         },
    { id: "altar",           name: "Altar",                 category: "furniture", color: "#3a3a3a", svg: TILE_ALTAR       },
    { id: "cave",            name: "Cueva",                 category: "furniture", color: "#2a2020", img: "/tiles/furniture/cave.png", svg: TILE_WALL_STONE },
];

// ─── Imágenes de tokens ───────────────────────────────────────────────────────

export const TOKEN_IMAGES = [
    { id: "araña",       name: "Araña",    img: "/tiles/tokens/araña.png"       },
    { id: "ciclope",     name: "Cíclope",  img: "/tiles/tokens/ciclope.png"     },
    { id: "fantasma",    name: "Fantasma", img: "/tiles/tokens/fantasma.png"    },
    { id: "cofre",       name: "Tesoro",   img: "/tiles/tokens/cofre.png"       },
    { id: "chest-close", name: "Cofre",    img: "/tiles/tokens/chest-close.png" },
];

/** Mapa id → tile para búsquedas O(1) */
export const TILE_BY_ID = Object.fromEntries(TILE_CATALOG.map(t => [t.id, t]));

/** Tile por defecto cuando una celda no tiene asignado ningún id */
export const TILE_DEFAULT = TILE_CATALOG[0]; // floor-stone
