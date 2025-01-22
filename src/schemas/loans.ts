import mongoose from "mongoose";

const InstallmentSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'liquidated', 'partial'],
        default: 'pending',
        required: true
    },
    payment: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    payment_date: { type: Date, default: null },
    end_date: { type: Date, default: Date.now },
});

const Loans = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    status: {
        type: String,
        enum: ['pending', 'liquidated', 'partial'],
        default: 'pending',
        required: true
    },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    interest: { type: Number, required: true},
    installments_qty: { type: Number },
    installments_info: {
        paid_installments: { type: Number, required: true, default: 0 }, // total de cuotas pagadas
    },
    installments: [InstallmentSchema],
    payment_actual: { type: Number, required: true },
    payment_missing: { type: Number, required: true },
    payment_method: {
        type: String,
        enum: ['diary', 'weekly', 'fortnightly', 'monthly'],
        default: 'diary',
        required: true
    },
    createdAt: { type: Date, default: Date.now }
})

export const LoansSchema = mongoose.model("Loan", Loans)
