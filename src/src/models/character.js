import { Schema, model } from "mongoose";



const characterSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    charClass: { type: String, required: true },
    level: { type: Number, default: 1 },
    gold: { type: Number, default: 0 },
    pdfUrl: { type: String },
    inventory: [itemSchema], // Inventario embebido
    history: String
}, { timestamps: true });

export default model("Character", characterSchema);