import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    phone: String,
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "photographer"], default: "photographer" },
});

export const User = mongoose.model("User", userSchema);
