require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./src/app');

async function start() {
  const { MONGODB_URI, JWT_SECRET } = process.env;
  const port = Number(process.env.PORT || 4000);

  if (!MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  app.listen(port, () => console.log(`Kotong backend listening on port ${port}`));
}

start().catch((error) => {
  console.error('Failed to start Kotong backend:', error);
  process.exitCode = 1;
});
