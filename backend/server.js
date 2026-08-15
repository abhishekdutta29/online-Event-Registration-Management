const express = require('express');
const path = require('path');
const db = require('./models/db');
require('dotenv').config();

const authController = require('./controllers/authController');
const eventController = require('./controllers/eventController');
const registrationController = require('./controllers/registrationController');
const adminController = require('./controllers/adminController');

const { verifyToken, isAdmin } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../frontend')));

// Authentication API
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', verifyToken, authController.getMe);

// Event Browsing API
app.get('/api/events', eventController.getEvents);
app.get('/api/events/categories', eventController.getCategories);
app.get('/api/events/:id', eventController.getEventById);

// Registration API
app.post('/api/registrations', verifyToken, registrationController.registerForEvent);
app.get('/api/registrations/my', verifyToken, registrationController.getMyRegistrations);
app.put('/api/registrations/:id/cancel', verifyToken, registrationController.cancelRegistration);

// Admin-facing API
app.get('/api/admin/stats', verifyToken, isAdmin, adminController.getStats);
app.post('/api/admin/events', verifyToken, isAdmin, adminController.addEvent);
app.put('/api/admin/events/:id', verifyToken, isAdmin, adminController.editEvent);
app.delete('/api/admin/events/:id', verifyToken, isAdmin, adminController.deleteEvent);
app.get('/api/admin/events/:id/registrants', verifyToken, isAdmin, adminController.getEventRegistrants);

// Fallback: Send index.html for SPA router (if any) or simply redirect
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await db.connect();
    // Only listen if not running as a Vercel Serverless Function
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`=================================================`);
        console.log(`  Event Registration system running on port ${PORT}`);
        console.log(`  Local Address: http://localhost:${PORT}`);
        console.log(`=================================================`);
      });
    }
  } catch (err) {
    console.error('Failed to start server due to database initialization failure:', err);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

// Connect to database on load (Express handler is stateless on Vercel)
if (process.env.VERCEL) {
  db.connect().catch(err => console.error('Database connection failed in Vercel function:', err));
} else {
  startServer();
}

module.exports = app;
