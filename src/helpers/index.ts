import crypto from 'crypto';

const SECRET_KEY = process.env.SECRET_KEY

export const randomToken = () =>{
  return crypto.randomBytes(128).toString('base64');
}

export const authentication: any = (salt: string , password: string) =>{
  if(SECRET_KEY){
    return crypto.createHmac('sha256', [salt, password].join('/')).update(SECRET_KEY).digest('hex')
  }

  return null;
}