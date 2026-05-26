import mongoose from "mongoose";

// ─── Entrada del log de una sesión ───────────────────────────────────────────
// kind:
//   "diary"     → narración de lo sucedido (texto libre)
//   "note"      → recordatorio / apunte rápido del DM
//   "encounter" → encuentro con un monstruo
const logEntrySchema = new mongoose.Schema(
    {
        kind: {
            type: String,
            enum: ["diary", "note", "encounter"],
            default: "note"
        },
        content:      { type: String, default: "" },
        // Legacy — un solo monstruo (mantener para datos anteriores)
        monster:      { type: mongoose.Schema.Types.ObjectId, ref: "Monster" },
        monsterName:  { type: String, trim: true },
        // Nuevo — varios monstruos por encuentro
        monsters:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Monster" }],
        monsterNames: [{ type: String, trim: true }]
    },
    { timestamps: true }
);

// ─── Sesión individual dentro de una campaña ─────────────────────────────────
const sessionSchema = new mongoose.Schema(
    {
        title:   { type: String, required: true, trim: true },
        date:    { type: Date },
        summary: { type: String, default: "" },
        log:     [logEntrySchema]
    },
    { timestamps: true }
);

// ─── Participante de la campaña ───────────────────────────────────────────────
const participantSchema = new mongoose.Schema(
    {
        character:     { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
        characterName: { type: String, trim: true }
    },
    { _id: false }
);

// ─── Campaña ──────────────────────────────────────────────────────────────────
const campaignSchema = new mongoose.Schema(
    {
        dm: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name:        { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        status: {
            type: String,
            enum: ["planning", "active", "paused", "completed"],
            default: "planning"
        },
        participants: [participantSchema],
        sessions:    [sessionSchema],
        monsters:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Monster" }],
        notes:       { type: String, default: "" }
    },
    { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);
