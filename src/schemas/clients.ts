import mongoose from "mongoose";

const Client = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
})

export const ClientSchema = mongoose.model("Client", Client)
