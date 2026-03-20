import { UserSchema } from "../schemas/users";
import { authentication, randomToken } from "./index";

export const initializeSuperAdmin = async (): Promise<void> => {
    try {
        const superAdminEmail = process.env.SUPERADMIN_EMAIL;
        const superAdminPassword = process.env.SUPERADMIN_PASSWORD;
        const secretKey = process.env.SECRET_KEY;

        if (!superAdminEmail || !superAdminPassword) {
            console.error('❌ Project cannot start without superadmin credentials');
            process.exit(1);
        }

        if (!secretKey) {
            console.error('❌ ERROR: SECRET_KEY must be defined in environment variables');
            process.exit(1);
        }

        const normalizedEmail = superAdminEmail.toLowerCase();

        const existingSuperAdmin = await UserSchema.findOne({ 
            email: normalizedEmail,
            type: 'super'
        });

        if (existingSuperAdmin) {
            console.log('✓ Superadmin already exists, creation omitted');
            return;
        }

        const salt = randomToken();

        const superAdmin = new UserSchema({
            name: 'super',
            lastname: 'admin',
            email: normalizedEmail,
            type: 'super',
            company_name: 'CrediDash System',
            authentication: {
                salt,
                password: authentication(salt, superAdminPassword),
            },
        });

        await superAdmin.save();
        console.log('✓ Superadmin created successfully');
    } catch (error) {
        console.error('❌ ERROR initializing superadmin:', error);
        console.error('❌ Project cannot start without superadmin');
        process.exit(1);
    }
};
