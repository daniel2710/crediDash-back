import mongoose from "mongoose";
import { Response } from 'express';

export const validateObjectId = (id: string, fieldName: string, res: Response) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            status: 'failed',
            message: `Invalid or missing ${fieldName}`,
        });
    }
    return null; // Si es válido, retornar null para continuar el flujo
};