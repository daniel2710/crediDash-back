import { Request, Response } from "express";
import { UserSchema } from "../../schemas/users";

export const getUserById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({
          status: 'failed',
          message: 'User ID is required',
        });
      }
  
      const user = await UserSchema.findById({ _id: id })
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
      console.error('Error finding user by ID:', error);
      return res.status(500).json({
        status: 'failed',
        message: 'An unexpected error occurred',
      });
    }
  };