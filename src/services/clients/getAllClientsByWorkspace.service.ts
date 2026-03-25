import { ClientSchema } from "../../schemas/clients";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { LoansSchema } from "../../schemas/loans";
import { buildPaginationUrls } from "../../helpers/buildPaginationUrls";

export const findAllClientsByWorkspace = async (workspaceId: string, currentPage: number, limit: number, searchTerm?: string) => {
    const workspace = await WorkspaceSchema.findById(workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const skip = (currentPage - 1) * limit;

    const query: any = { workspaceId };

    if (searchTerm) {
        query.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { phone: { $regex: searchTerm, $options: 'i' } },
            { address: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    const [clients, totalItems] = await Promise.all([
        ClientSchema.find(query).skip(skip).limit(limit),
        ClientSchema.countDocuments(query)
    ]);

    if (clients.length === 0 && currentPage !== 1) {
        throw new Error('There are no results on the current page.');
    }

    const clientsWithLastLoan = await Promise.all(
        clients.map(async (client) => {
            const lastLoan = await LoansSchema.findOne({ clientId: client._id })
                .sort({ createdAt: -1 })
                .select('createdAt payment_missing payment_actual status')
                .lean();

            return {
                ...client.toObject(),
                lastLoan: lastLoan ? {
                    fecha_ultimo_prestamo: lastLoan.createdAt,
                    deuda_a_la_fecha: lastLoan.payment_missing,
                    total_abonado: lastLoan.payment_actual,
                    estado_prestamo: lastLoan.status
                } : null
            };
        })
    );

    const pagination: { next: string | null; previous: string | null; totalPages: number } = buildPaginationUrls(`clients/workspace/${workspaceId}`, currentPage, totalItems, limit);

    return {
        clients: clientsWithLastLoan,
        current_page: currentPage,
        total_pages: pagination.totalPages,
        next: pagination.next,
        previous: pagination.previous,
        total_items: totalItems,
        items_on_page: clientsWithLastLoan.length,
    };
};
