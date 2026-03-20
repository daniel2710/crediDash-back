import mongoose from "mongoose";
import { UserSchema } from "../../schemas/users";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { authentication, randomToken } from "../../helpers";

export const createUserWithWorkspace = async (userData: {
    name: string;
    lastname: string;
    email: string;
    password: string;
    type: string;
}) => {
    const { name, lastname, email, password, type } = userData;

    if (type === 'super') {
        throw new Error('Cannot create superadmin users manually');
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedName = name.toLowerCase();
    const normalizedLastname = lastname.toLowerCase();

    const existingUser = await UserSchema.findOne({ email: normalizedEmail });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const salt = randomToken();

        const newUser = new UserSchema({
            name: normalizedName,
            lastname: normalizedLastname,
            email: normalizedEmail,
            type,
            authentication: {
                salt,
                password: authentication(salt, password),
            },
        });

        const savedUser = await newUser.save({ session });

        const newWorkspace = new WorkspaceSchema({
            userId: savedUser._id,
            plan: 'free',
            interface_config: { theme: 'light' },
            stats: {
                total_loans: 0,
                total_clients: 0,
                total_lents: 0,
                total_incomes: 0,
                total_pending: 0,
            },
        });

        const savedWorkspace = await newWorkspace.save({ session });

        savedUser.workspaceId = savedWorkspace._id;
        await savedUser.save({ session });

        await session.commitTransaction();

        const userObject = savedUser.toObject();
        delete userObject.authentication;

        return { user: userObject, workspace: savedWorkspace };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};