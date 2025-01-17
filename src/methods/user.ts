import { UserSchema } from "../schemas/users";

export const getUsers = () => {
    return UserSchema.find();
}

export const getUserBySessionToken = (sessionToken: string) =>{
    return UserSchema.findOne({
        'authentication.sessionToken': sessionToken
    })
}

export const getUserByEmail = (email: string) =>{
    return UserSchema.findOne({ email })
}

export const createUser = (values: Record<string, any>) =>{

    const newWorkspaceData = {
        name: 'My workspace',
        description: 'My workspace',
        theme: 'light',
        createdBy: {} 
    };

    return new UserSchema(values).save()
    .then((user) => {
        newWorkspaceData.createdBy = user._id;
        // const newWorkspace = new WorkSpaceModel(newWorkspaceData); 
        // values.workspace = newWorkspace._id
        // return newWorkspace.save();
        return user
    })
    .catch((error) => {
        throw new Error(`Error al crear usuario y espacio de trabajo: ${error}`);
    });
}