import mongoose from "mongoose";

const InterfaceConfigSchema = new mongoose.Schema({
    theme: { type: String, required: true, enum: ['light', 'dark'] }, // Definimos el tema con valores posibles
});

const Workspace = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  plan: { type: String, enum: ['free', 'premium'], required: true },
  interface_config: { type: InterfaceConfigSchema, required: true }, // Ahora es un objeto definido por un esquema
  createdAt: { type: Date, default: Date.now }
});

export const WorkspaceSchema = mongoose.model('Workspace', Workspace);
