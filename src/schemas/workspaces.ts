import mongoose from "mongoose";

const InterfaceConfigSchema = new mongoose.Schema({
  theme: { type: String, required: true, enum: ['light', 'dark'] }, // Definimos el tema con valores posibles
});

const Workspace = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  plan: { type: String, enum: ['free', 'premium'], required: true },
  interface_config: { type: InterfaceConfigSchema, required: true }, // Ahora es un objeto definido por un esquema
  stats: {
    total_loans: { type: Number, default: 0, required: true }, // Total de préstamos
    active_loans: { type: Number, default: 0, required: true }, // prestamos activos
    liquidate_loans: { type: Number, default: 0, required: true }, // prestamos liquidados
    total_clients: { type: Number, default: 0, required: true }, // total de clientes
    total_lents: { type: Number, default: 0, required: true }, // total de egresos
    total_incomes: { type: Number, default: 0, required: true }, // total de ingresos
    total_pending: { type: Number, default: 0, required: true }, // total de cartera
  },
  createdAt: { type: Date, default: Date.now }
});

export const WorkspaceSchema = mongoose.model('Workspace', Workspace);
