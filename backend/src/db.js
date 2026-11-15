const mongoose = require('mongoose');

const SERVER_SELECTION_TIMEOUT_MS = 10000;
const CONNECTED = 1;

let pendingConnection = null;

// Serverless runtimes (Vercel) import the app without running server.js,
// so the connection is opened lazily and reused across warm invocations.
async function connectDb() {
  if (mongoose.connection.readyState === CONNECTED) return mongoose.connection;

  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required');

  if (!pendingConnection) {
    pendingConnection = mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS })
      .catch((error) => {
        pendingConnection = null;
        throw error;
      });
  }
  await pendingConnection;
  return mongoose.connection;
}

module.exports = connectDb;
