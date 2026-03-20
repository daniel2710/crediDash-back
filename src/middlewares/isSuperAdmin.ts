import { Request, Response, NextFunction } from 'express';

export const isSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).identity;

        if (!user) {
            return res.status(403).json({
                status: 'failed',
                message: 'Authentication required'
            });
        }

        if (user.type === 'super') {
            return next();
        }

        return res.status(403).json({
            status: 'failed',
            message: 'Superadmin access required'
        });
    } catch (error) {
        console.log("Error in isSuperAdmin middleware:", error);
        return res.status(500).json({
            status: 'failed',
            message: 'Internal server error'
        });
    }
};
