import { Request, Response, NextFunction } from 'express';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const headers = req.headers;
  const body = req.body;

  console.log(`[${timestamp}] Method: ${method} - URL: ${url}`);
  console.log('Headers:', headers);
  console.log('Body:', body);

  const start = process.hrtime();
  
  res.on('finish', () => {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    const statusCode = res.statusCode;

    console.log(`Status Code: ${statusCode}`);
    console.log(`Duration: ${durationInMilliseconds.toLocaleString()} ms`);
    console.log('----------------------------------------------------------------');
  });

  next();
};

const getDurationInMilliseconds = (start: [number, number]) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

export default requestLogger;

