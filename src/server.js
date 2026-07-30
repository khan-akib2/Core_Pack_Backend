// Database connection and server initialization
import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { seedDatabase } from './utils/seed.js';

const PORT = process.env.PORT || 5000;

connectDB().then(async (connected) => {
  if (connected) {
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Core Pack India Backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  app.listen(PORT, () => {
    console.log(`🚀 Core Pack India Backend running on port ${PORT} in fallback mode`);
  });
});
