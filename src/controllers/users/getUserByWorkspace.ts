import { Request, Response } from "express";
import { UserSchema } from "../../schemas/users";

export const getUserByWorkspace = async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;
  
      if (!workspaceId) {
        return res.status(400).json({
          status: 'failed',
          message: 'workspaceId is required',
        });
      }
  
      // Encontrar usuario y poblar información del workspace
      const user = await UserSchema.findOne({ workspaceId }).populate('workspaceId'); 
  
      if (!user) {
        return res.status(404).json({
          status: 'failed',
          message: 'User not found',
        });
      }
  
      return res.status(200).json({
        status: 'success',
        user,
      });
    } catch (error) {
      console.error('Error finding users by workspace ID:', error);
      return res.status(500).json({
        status: 'failed',
        message: 'An unexpected error occurred',
      });
    }
  };