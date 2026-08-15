const db = require('../models/db');

const addEvent = async (req, res) => {
  const { title, description, category, date, time, location, capacity, image_url } = req.body;

  if (!title || !category || !date || !time || !location || capacity === undefined) {
    return res.status(400).json({ message: 'Title, category, date, time, location, and capacity are required.' });
  }

  const capVal = parseInt(capacity, 10);
  if (isNaN(capVal) || capVal < 1) {
    return res.status(400).json({ message: 'Capacity must be a positive integer.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO events (title, description, category, date, time, location, capacity, spots_left, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', category, date, time, location, capVal, capVal, image_url || '/images/tech_conf.png']
    );

    res.status(201).json({
      message: 'Event created successfully.',
      eventId: result.insertId
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Internal server error while creating event.' });
  }
};

const editEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, date, time, location, capacity, image_url } = req.body;

  if (!title || !category || !date || !time || !location || capacity === undefined) {
    return res.status(400).json({ message: 'Title, category, date, time, location, and capacity are required.' });
  }

  const capVal = parseInt(capacity, 10);
  if (isNaN(capVal) || capVal < 1) {
    return res.status(400).json({ message: 'Capacity must be a positive integer.' });
  }

  try {
    // Check if event exists
    const events = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Get active registrants count
    const regCountResult = await db.query(
      "SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'confirmed'",
      [id]
    );
    const activeRegistrants = regCountResult[0].count;

    if (capVal < activeRegistrants) {
      return res.status(400).json({
        message: `Capacity cannot be reduced to ${capVal} because there are already ${activeRegistrants} active registrations.`
      });
    }

    const newSpotsLeft = capVal - activeRegistrants;

    await db.query(
      `UPDATE events 
       SET title = ?, description = ?, category = ?, date = ?, time = ?, location = ?, capacity = ?, spots_left = ?, image_url = ? 
       WHERE id = ?`,
      [title, description || '', category, date, time, location, capVal, newSpotsLeft, image_url || events[0].image_url || '/images/tech_conf.png', id]
    );

    res.json({ message: 'Event updated successfully.' });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Internal server error while updating event.' });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const events = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // SQLite will cascade delete registrations if configured correctly (PRAGMA foreign_keys = ON)
    // MySQL will cascade delete due to ON DELETE CASCADE
    // We execute the delete query
    await db.query('DELETE FROM events WHERE id = ?', [id]);

    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Internal server error while deleting event.' });
  }
};

const getEventRegistrants = async (req, res) => {
  const { id } = req.params;
  try {
    const registrants = await db.query(
      `SELECT r.id as registration_id, r.status, r.registered_at, 
              u.id as user_id, u.username, u.email 
       FROM registrations r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = ? 
       ORDER BY r.registered_at DESC`,
      [id]
    );
    res.json(registrants);
  } catch (err) {
    console.error('Error fetching event registrants:', err);
    res.status(500).json({ message: 'Internal server error while fetching event registrants.' });
  }
};

const getStats = async (req, res) => {
  try {
    const eventCount = await db.query('SELECT COUNT(*) as count FROM events');
    const userCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const regCount = await db.query("SELECT COUNT(*) as count FROM registrations WHERE status = 'confirmed'");

    res.json({
      totalEvents: eventCount[0].count,
      totalUsers: userCount[0].count,
      totalRegistrations: regCount[0].count
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ message: 'Internal server error while fetching stats.' });
  }
};

module.exports = {
  addEvent,
  editEvent,
  deleteEvent,
  getEventRegistrants,
  getStats
};
