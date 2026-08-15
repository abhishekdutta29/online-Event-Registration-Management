const db = require('../models/db');

const getEvents = async (req, res) => {
  const { search, category } = req.query;
  let sql = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  sql += ' ORDER BY date ASC, time ASC';

  try {
    const events = await db.query(sql, params);
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Internal server error while fetching events.' });
  }
};

const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const events = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    res.json(events[0]);
  } catch (err) {
    console.error('Error fetching event detail:', err);
    res.status(500).json({ message: 'Internal server error while fetching event details.' });
  }
};

const getCategories = async (req, res) => {
  try {
    const rows = await db.query('SELECT DISTINCT category FROM events ORDER BY category ASC');
    const categories = rows.map(r => r.category);
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Internal server error fetching categories.' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  getCategories
};
