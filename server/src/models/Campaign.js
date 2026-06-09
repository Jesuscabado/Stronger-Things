import mongoose from "mongoose";

// ─── Nota individual del DM ───────────────────────────────────────────────────
const noteCardSchema = new mongoose.Schema(
    { content: { type: String, default: "" } },
    { timestamps: true }
);

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
        title:     { type: String, required: true, trim: true },
        date:      { type: Date },
        summary:   { type: String, default: "" },
        // Duración real de la sesión en minutos (para el resumen de horas jugadas)
        duration:  { type: Number, min: 0 },
        attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
        log:       [logEntrySchema]
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

// ─── Plantilla de encuentro reutilizable ─────────────────────────────────────
// Combinación de monstruos guardada por el DM para registrar encuentros
// recurrentes ("3 acólitos + 1 sacerdote") sin tener que repetir la selección.
const encounterTemplateSchema = new mongoose.Schema(
    {
        name:     { type: String, required: true, trim: true },
        monsters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Monster" }]
    },
    { timestamps: true }
);

// ─── Encuesta de disponibilidad ──────────────────────────────────────────────
// El DM propone fechas para la próxima sesión y los aventureros votan cuál
// les viene mejor. Cada opción guarda los personajes que han votado por ella.
const availabilityOptionSchema = new mongoose.Schema(
    {
        date:  { type: Date, required: true },
        votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }]
    }
);

const availabilityPollSchema = new mongoose.Schema(
    {
        title:   { type: String, required: true, trim: true, default: "¿Cuándo jugamos la próxima sesión?" },
        status:  { type: String, enum: ["open", "closed"], default: "open" },
        options: [availabilityOptionSchema]
    },
    { timestamps: true }
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
        notes:       { type: String, default: "" },
        // Notas privadas del DM (tramas, secretos) — nunca visibles para jugadores
        noteCards:   [noteCardSchema],
        // Notas que el DM decide compartir con los aventureros de la campaña
        sharedNotes: [noteCardSchema],
        encounterTemplates: [encounterTemplateSchema],
        availabilityPolls:  [availabilityPollSchema]
    },
    { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);
