import mongoose from "mongoose";

// ─── Sub-esquemas ─────────────────────────────────────────────────────────────

const gridSchema = new mongoose.Schema(
    {
        cols:     { type: Number, default: 30 },
        rows:     { type: Number, default: 20 },
        cellSize: { type: Number, default: 32 }
    },
    { _id: false }
);

// Segmento de pared entre dos celdas: from/to son [col, row]
const wallSchema = new mongoose.Schema(
    {
        from: { type: [Number], required: true },
        to:   { type: [Number], required: true }
    },
    { _id: false }
);

const hpSchema = new mongoose.Schema(
    {
        current: { type: Number },
        max:     { type: Number }
    },
    { _id: false }
);

// Token: ficha sobre el mapa (PC, monstruo, NPC u objeto)
const tokenSchema = new mongoose.Schema(
    {
        id:        { type: String, required: true },          // UUID generado en cliente
        kind:      { type: String, enum: ["pc", "monster", "npc", "object"], required: true },
        name:      { type: String, required: true, trim: true },
        x:         { type: Number, required: true },          // posición en celdas (decimal OK)
        y:         { type: Number, required: true },
        color:     { type: String, default: "#daa520" },
        monster:   { type: mongoose.Schema.Types.ObjectId, ref: "Monster" },
        character: { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
        object:    { type: mongoose.Schema.Types.ObjectId, ref: "BaseObject" },
        hp:        { type: hpSchema },
        tokenImg:  { type: String, default: "" },
        notes:     { type: String, default: "" }
    },
    { _id: false }
);

const aiMetaSchema = new mongoose.Schema(
    {
        prompt: { type: String, default: "" },
        style:  { type: String, default: "" }
    },
    { _id: false }
);

// ─── Mapa ─────────────────────────────────────────────────────────────────────

const mapSchema = new mongoose.Schema(
    {
        dm: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      "User",
            required: true
        },
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Session"
            // opcional — un mapa puede existir sin sesión asociada
        },
        name:        { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        grid:        { type: gridSchema, default: () => ({}) },
        // Matriz terrain[col][row] = tileId (ej. "floor-stone").
        // Se almacena como Array genérico para soportar arrays anidados.
        terrain:     { type: Array, default: [] },
        walls:       [wallSchema],
        tokens:      [tokenSchema],
        aiMeta:      { type: aiMetaSchema, default: () => ({}) }
    },
    { timestamps: true }
);

export default mongoose.model("Map", mapSchema);
