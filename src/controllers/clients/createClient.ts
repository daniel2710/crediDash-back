import { Request, Response } from "express";
import mongoose from "mongoose";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { ClientSchema } from "../../schemas/clients";

export const createClient = async (req: Request, res: Response) => {
    try {
        const { workspaceId, userId, name, lastname, email, phone, address, description } = req.body;

        // Verificar campos obligatorios
        if (!workspaceId || !userId || !name || !lastname) {
            return res.status(400).json({
                status: "failed",
                message: "workspaceId, userId, name, and lastname are required.",
            });
        }

        // Validar el formato de ObjectId
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid workspaceId format.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid userId format.",
            });
        }

        // Verificar si el workspace existe y pertenece al usuario
        const workspace = await WorkspaceSchema.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                status: "failed",
                message: "Workspace not found.",
            });
        }

        if (!workspace.userId!.equals(new mongoose.Types.ObjectId(userId))) {
            return res.status(403).json({
                status: "failed",
                message: "This workspace does not belong to the user.",
            });
        }

        // Verificar si existe un cliente con exactamente los mismos datos
        const duplicateClient = await ClientSchema.findOne({
            workspaceId,
            name,
            lastname,
            email,
            phone,
            address,
            description,
        });

        if (duplicateClient) {
            return res.status(400).json({
                status: "failed",
                message: "A client with the same exact data already exists.",
            });
        }

        // Crear y guardar el nuevo cliente
        const newClient = new ClientSchema({
            workspaceId,
            name,
            lastname,
            email,
            phone,
            address,
            description,
        });

        await newClient.save();

        // Actualizar el total de clientes en workspace.stats
        await WorkspaceSchema.findByIdAndUpdate(
            workspaceId,
            { $inc: { "stats.total_clients": 1 } },
            { new: true }
        );

        return res.status(201).json({
            status: "success",
            message: "Client created successfully.",
            client: newClient,
        });
    } catch (error) {
        console.error("Error creating client:", error);
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred.",
        });
    }
};