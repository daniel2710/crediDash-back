import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

function connectToDatabase() {
  mongoose.Promise = Promise;
  mongoose.connect(MONGODB_URI);

  mongoose.connection.on('error', (error) => {
    console.error('Database connection error (MongoDB):', error);
    process.exit(1);
  });

  mongoose.connection.once('open', () => {
    console.log('Successful connection to the database (MongoDB)');
  });
}

export default connectToDatabase;
