import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Email no válido"]
        },
        password_hash: { type: String, required: false },
         role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        isDM: { type: Boolean, default: false },
        googleId: {
            type: String,
            index: true,
            sparse: true,
            unique: true
        },
        provider: {
            type: String,
            enum: ["local", "google", "both"],
            default: "local"
        }
    },
    { timestamps: true }
);

// Nunca exponer el hash al serializar a JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password_hash;
    return obj;
};

export default mongoose.model("User", userSchema);
