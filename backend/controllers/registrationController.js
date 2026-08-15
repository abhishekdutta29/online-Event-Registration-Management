const db = require('../models/db');

const registerForEvent = async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required.' });
  }

  try {
    // 1. Fetch event details
    const events = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const event = events[0];

    // Check if event is fully booked
    if (event.spots_left <= 0) {
      return res.status(400).json({ message: 'Registration failed. Event is at full capacity.' });
    }

    // 2. Check if registration already exists
    const registrations = await db.query(
      'SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    if (registrations.length > 0) {
      const reg = registrations[0];
      if (reg.status === 'confirmed') {
        return res.status(400).json({ message: 'You are already registered for this event.' });
      } else {
        // Re-confirm a previously cancelled registration
        await db.query(
          "UPDATE registrations SET status = 'confirmed', registered_at = CURRENT_TIMESTAMP WHERE id = ?",
          [reg.id]
        );
        await db.query('UPDATE events SET spots_left = spots_left - 1 WHERE id = ?', [eventId]);
        return res.json({ message: 'Successfully re-registered for the event.', registrationId: reg.id });
      }
    }

    // 3. Create new registration
    const result = await db.query(
      "INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, 'confirmed')",
      [userId, eventId]
    );

    // Update spots left
    await db.query('UPDATE events SET spots_left = spots_left - 1 WHERE id = ?', [eventId]);

    res.status(201).json({
      message: 'Successfully registered for the event.',
      registrationId: result.insertId
    });
  } catch (err) {
    console.error('Error during event registration:', err);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

const getMyRegistrations = async (req, res) => {
  const userId = req.user.id;
  try {
    const registrations = await db.query(
      `SELECT r.id as registration_id, r.status, r.registered_at, 
              e.id as event_id, e.title, e.description, e.category, e.date, e.time, e.location
       FROM registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.user_id = ? 
       ORDER BY r.registered_at DESC`,
      [userId]
    );
    res.json(registrations);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ message: 'Internal server error while fetching registrations.' });
  }
};

const cancelRegistration = async (req, res) => {
  const regId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. Find registration
    const registrations = await db.query('SELECT * FROM registrations WHERE id = ?', [regId]);
    if (registrations.length === 0) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    const reg = registrations[0];

    // Ensure it belongs to the user
    if (reg.user_id !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only cancel your own registrations.' });
    }

    if (reg.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled.' });
    }

    // 2. Update registration status
    await db.query("UPDATE registrations SET status = 'cancelled' WHERE id = ?", [regId]);

    // 3. Restore capacity spot
    await db.query('UPDATE events SET spots_left = spots_left + 1 WHERE id = ?', [reg.event_id]);

    res.json({ message: 'Registration cancelled successfully.' });
  } catch (err) {
    console.error('Error cancelling registration:', err);
    res.status(500).json({ message: 'Internal server error while cancelling registration.' });
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration
};
