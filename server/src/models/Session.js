import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
    {
        character: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Character",
            required: true
        },
        characterName: { type: String, trim: true }
    },
    { _id: false }
);

const sessionSchema = new mongoose.Schema(
    {
        dm: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        date: { type: Date },
        status: {
            type: String,
            enum: ["planning", "active", "completed"],
            default: "planning"
        },
        participants: [participantSchema],
        notes: { type: String, default: "" },
        map: { type: mongoose.Schema.Types.ObjectId, ref: "Map", default: null }
    },
    { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
