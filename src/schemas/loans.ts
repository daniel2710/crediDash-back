import mongoose from "mongoose";

const InstallmentSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'liquidated', 'partial', 'late'],
        default: 'pending',
        required: true
    },
    payment: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    payment_date: { type: Date, default: null },
    end_date: { type: Date, default: Date.now },
});

const HistorySchema = new mongoose.Schema({
    payment_date: { type: Date, default: Date.now }, // Fecha del abono
    payment: { type: Number, required: true }, // Monto del abono
    remaining_balance: { type: Number, required: true }, // Saldo restante tras el abono
    paid_installments: { type: Number, required: true }, // Cuotas liquidadas hasta este momento
    loan_status: { type: String, required: true }, // Estado del préstamo después del pago
    paid_installment_ids: [{ type: mongoose.Schema.Types.ObjectId }], // IDs de las cuotas pagadas en esta transacción
    installment_details: [{
        installment_id: { type: mongoose.Schema.Types.ObjectId },
        amount_paid: { type: Number },
        previous_status: { type: String },
        new_status: { type: String }
    }] // Detalle de cada cuota afectada
});

const Loans = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    status: {
        type: String,
        enum: ['pending', 'liquidated', 'partial', 'late'],
        default: 'pending',
        required: true
    },
    description: { type: String, required: false },
    amount: { type: Number, required: true },
    interest: { type: Number, required: false, default: 0 },
    installments_qty: { type: Number },
    installments_info: {
        paid_installments: { type: Number, required: true, default: 0 }, // total de cuotas pagadas
    },
    installments: [InstallmentSchema],
    history: [HistorySchema],
    payment_actual: { type: Number, required: true },
    payment_missing: { type: Number, required: true },
    payment_frequency: {
        type: String,
        enum: ['diary', 'weekly', 'fortnightly', 'monthly'],
        default: null,
        required: false
    },
    start_date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
})

export const LoansSchema = mongoose.model("Loan", Loans)
