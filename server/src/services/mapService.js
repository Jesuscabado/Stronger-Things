import { randomUUID } from "node:crypto";
import Map from "../models/Map.js";
import Monster from "../models/Monster.js";
import Session from "../models/Session.js";
import { ensureClient, cleanJSON } from "./anthropicClient.js";

const VALID_TILE_IDS = [
    // terrain
    "floor-stone", "floor-stone-basic", "floor-stone-details",
    "floor-wood",
    "floor-grass", "floor-grass-stones",
    "floor-dirt", "floor-terrain",
    "water", "floor-water-tierra-arriba", "floor-water-tierra-arriba-dcha", "floor-water-tierra-arriba-izq",
    "lava",
    // walls
    "wall-stone", "wall-brick", "muro-piedra",
    // furniture
    "door", "puerta-piedra", "stairs-up", "stairs-down", "chest", "table", "bed", "altar", "cave"
];
const VALID_TILE_SET = new Set(VALID_TILE_IDS);

// ─── Helpers de error ─────────────────────────────────────────────────────────

const notFound = (msg = "Mapa no encontrado") => {
    const err = new Error(msg);
    err.status = 404;
    return err;
};

const forbidden = (msg = "Acceso denegado") => {
    const err = new Error(msg);
    err.status = 403;
    return err;
};

const checkOwner = (map, dmId) => {
    if (!map) throw notFound();
    if (!map.dm.equals(dmId)) throw forbidden();
};

// ─── Populate ─────────────────────────────────────────────────────────────────

const listPopulate = (q) =>
    q.populate({ path: "session", select: "name date status" });

const detailPopulate = (q) =>
    q
        .populate({ path: "session",           select: "name date status" })
        .populate({ path: "tokens.monster",    select: "name challengeRating type" })
        .populate({ path: "tokens.character",  select: "name charClass level avatar" })
        .populate({ path: "tokens.object",     select: "name description category stats" });

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const list = (dmId) =>
    listPopulate(
        Map.find({ dm: dmId }, "name description session grid createdAt updatedAt")
           .sort({ updatedAt: -1 })
    ).lean();

export const getById = async (id, dmId) => {
    const map = await detailPopulate(Map.findById(id));
    checkOwner(map, dmId);
    return map;
};

export const create = async (data, dmId) => {
    const { name, description, session, grid, terrain, walls, tokens, aiMeta } = data;
    return Map.create({ dm: dmId, name, description, session, grid, terrain, walls, tokens, aiMeta });
};

export const update = async (id, data, dmId) => {
    const map = await Map.findById(id);
    checkOwner(map, dmId);

    const { name, description, session, grid, terrain, walls, tokens, aiMeta } = data;
    if (name        !== undefined) map.name        = name;
    if (description !== undefined) map.description = description;
    if (session     !== undefined) map.session     = session || null;
    if (grid        !== undefined) Object.assign(map.grid, grid);
    if (terrain     !== undefined) map.terrain     = terrain;
    if (walls       !== undefined) map.walls       = walls;
    if (tokens      !== undefined) map.tokens      = tokens;
    if (aiMeta      !== undefined) map.aiMeta      = aiMeta;

    await map.save();
    return detailPopulate(Map.findById(id)).lean();
};

export const remove = async (id, dmId) => {
    const map = await Map.findById(id);
    checkOwner(map, dmId);
    // Unlink from any sessions that reference this map (no cascade delete)
    await Session.updateMany({ map: id }, { $unset: { map: "" } });
    await map.deleteOne();
    return { message: "Mapa eliminado" };
};

// ─── Generación con IA ────────────────────────────────────────────────────────

/**
 * Extracts the first complete JSON object from `text` by counting braces.
 * Handles preamble/postamble text and strings containing { or }.
 */
function extractFirstJSON(text) {
    // Strip markdown fences first
    const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "");
    const start = clean.indexOf("{");
    if (start === -1) return clean.trim();
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < clean.length; i++) {
        const ch = clean[i];
        if (escape)          { escape = false; continue; }
        if (ch === "\\")     { escape = true;  continue; }
        if (ch === '"')      { inString = !inString; continue; }
        if (inString)        continue;
        if (ch === "{")      depth++;
        else if (ch === "}") { if (--depth === 0) return clean.slice(start, i + 1); }
    }
    // Truncated JSON — return what we have and let JSON.parse surface a useful error
    return clean.slice(start);
}

export const generateFromPrompt = async (prompt, options = {}, _dmId) => {
    const cols = Number(options?.cols) || 20;
    const rows = Number(options?.rows) || 15;
    const style = options?.style ? `\nESTILO ADICIONAL: ${options.style}` : "";

    const tileList = VALID_TILE_IDS.map(id => `"${id}"`).join(", ");

    const systemPrompt =
`Eres un generador experto de mapas tácticos para Dungeons & Dragons 5e.
Devuelves ÚNICAMENTE un objeto JSON válido. Ningún texto antes ni después. Ningún bloque de código.`;

    const userPrompt =
`Genera un mapa táctico de ${cols} columnas × ${rows} filas para D&D 5e.

DESCRIPCIÓN: ${prompt}${style}

TILES VÁLIDOS — usa SOLO estos IDs exactos: ${tileList}

═══ REGLAS DE CONSTRUCCIÓN ═══

1. ESTRUCTURA EN ZONAS
   Divide el mapa en 2-4 zonas funcionales bien diferenciadas.
   Ejemplos según ambiente:
   - Mazmorra: pasillo de entrada → sala de guardia → cámara principal → celda lateral
   - Taberna: puerta principal → sala de mesas → barra con cocina → escaleras al piso superior
   - Templo: nave → altar central → sacristía → cripta trasera
   - Exterior: camino → claro central → zona boscosa → ruinas

2. MUROS Y PUERTAS
   • Perímetro completo: "wall-stone" o "wall-brick".
   • Muros internos para separar zonas; deja huecos de 1-2 celdas como umbrales.
   • Coloca "door" en cada umbral entre zonas.

3. VARIACIÓN DE SUELOS (OBLIGATORIO — mezcla al menos 3 tipos distintos)
   • Usa tipos diferentes por zona: pasillos distintos a salas, zonas húmedas con "water",
     exteriores con "floor-grass" o "floor-terrain", áreas dañadas con "floor-dirt".
   • Evita matrices de un solo tile; añade variación célula a célula donde tenga sentido.

4. MOBILIARIO DENSO (mínimo 8-12 piezas)
   • Distribuye "table", "chest", "bed", "altar", "stairs-up", "stairs-down", "cave"
     de forma coherente con la función de cada zona.
   • Agrupa muebles (2-3 mesas juntas, varias camas en dormitorio, etc.).

5. TOKENS TÁCTICOS (2-6 criaturas)
   • Posiciones tácticamente interesantes: guardias en puertas, patrullas en pasillos,
     jefe/élite en la sala más interior, civiles/prisioneros en zonas secundarias.
   • Usa coordenadas variadas (no todos en el centro).
   • Para monstruos del SRD incluye monsterName en inglés.
   • Colores sugeridos: enemigos "#cc2200", aliados "#1a6e2e", neutrales "#4a5a8a".

ESQUEMA DE RESPUESTA (sin texto extra, sin bloques de código):
{
  "name": "<nombre evocador del lugar>",
  "description": "<2-3 frases de atmósfera>",
  "grid": {"cols": ${cols}, "rows": ${rows}},
  "terrain": [
    ["<ID>", "<ID>", ...],
    ...
  ],
  "walls": [],
  "tokens": [
    {"kind": "monster", "name": "<nombre visible>", "x": 0, "y": 0, "color": "#cc2200", "monsterName": "<nombre SRD en inglés>"}
  ]
}`;

    const response = await ensureClient().messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "";
    let parsed;
    try {
        parsed = JSON.parse(extractFirstJSON(raw));
    } catch (parseErr) {
        console.error("[generateFromPrompt] JSON inválido. stop_reason:", response.stop_reason);
        console.error("[generateFromPrompt] Primeros 500 chars:", raw.slice(0, 500));
        const err = new Error("Claude devolvió JSON inválido para el mapa");
        err.status = 502;
        throw err;
    }

    // Validate and normalize terrain dimensions + tile IDs
    const terrain = [];
    for (let r = 0; r < rows; r++) {
        const srcRow = Array.isArray(parsed.terrain?.[r]) ? parsed.terrain[r] : [];
        const row = [];
        for (let c = 0; c < cols; c++) {
            const cell = srcRow[c];
            row.push(VALID_TILE_SET.has(cell) ? cell : "floor-stone");
        }
        terrain.push(row);
    }

    // Resolve monster tokens: monsterName → DB ObjectId
    const tokens = [];
    for (const t of parsed.tokens ?? []) {
        const token = {
            id:    randomUUID(),
            kind:  ["monster", "character", "npc", "object"].includes(t.kind) ? t.kind : "npc",
            name:  String(t.name  ?? "Token"),
            x:     Math.max(0, Math.min(cols - 1, Number(t.x) || 0)),
            y:     Math.max(0, Math.min(rows - 1, Number(t.y) || 0)),
            color: typeof t.color === "string" && /^#[0-9a-fA-F]{3,6}$/.test(t.color)
                       ? t.color : "#888888",
            notes: String(t.notes ?? "")
        };

        if (t.kind === "monster" && t.monsterName) {
            const escaped = String(t.monsterName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const monster = await Monster.findOne(
                { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
                "_id"
            ).lean();
            if (monster) token.monster = monster._id;
        }

        tokens.push(token);
    }

    return {
        name:        String(parsed.name        ?? "Mapa generado"),
        description: String(parsed.description ?? ""),
        grid:        { cols, rows, cellSize: 32 },
        terrain,
        walls:       Array.isArray(parsed.walls) ? parsed.walls : [],
        tokens
    };
};
