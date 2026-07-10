const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

// Connect to MongoDB Atlas
connectDB();

// Start Listening
app.listen(PORT, () => {
    console.log(`Express server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});
