import { UserSchema } from "../../schemas/users";

export const findUserById = async (id: string) => {
    const user = await UserSchema.findById({ _id: id });
    
    if (!user) {
        throw new Error('User not found');
    }
    
    return user;
};