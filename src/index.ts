import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectToDatabase from './db/connection';
import routes from './routes';
import requestLogger from './middlewares/logger';

const PORT = process.env.PORT ?? 8080
export const URL_BASE = process.env.URL_BASE ?? 'http://localhost';

dotenv.config();    

const app = express()
app.use(cookieParser())
app.use(express.json()) // middleware que trasnforma la req.body en json
app.use(requestLogger)

connectToDatabase()

const server = http.createServer(app);

server.listen(PORT, ()=>{
    console.log(`server listening on ${URL_BASE}:${PORT}/`)
});


app.use('/api', routes())