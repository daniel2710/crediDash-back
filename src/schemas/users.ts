import mongoose from "mongoose";

const User = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    type: { type: String, enum: ['admin', 'reviewer'], required: true },
    authentication: {
        salt: { type: String, select: false },
        sessionToken: { type: String, select: false },
        password: { type: String, required: true, select: false } 
    },
    createdAt: { type: Date, default: Date.now }
})

export const UserSchema = mongoose.model("User", User)


