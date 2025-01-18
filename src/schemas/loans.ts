import mongoose from "mongoose";

const Loans = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    status: {
        type: String,
        enum: ['pending', 'completed', 'late'],
        default: 'pending',
        required: true
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    interest: { type: Number, required: true},
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    payment_method: {
        type: String,
        enum: ['diary', 'weekly', 'fortnightly', 'monthly'],
        default: 'diary',
        required: true
    },
    createdAt: { type: Date, default: Date.now }
})

export const LoansSchema = mongoose.model("Loan", Loans)
