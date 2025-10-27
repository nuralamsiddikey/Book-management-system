import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/book-management',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
}));