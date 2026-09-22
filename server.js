const express = require('express');
const cors = require('cors');
const path = require('path'); // Fixes the "path is not defined" error
const { Pool } = require('pg'); // Fixes the "Cannot find module 'pg'" error

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Crucial: Allows index.html to talk to localhost:3000
app.use(express.json());
app.use(express.static('./'));

// Use the URL from Render, or fallback to local only for testing
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This is required for Render
  }
});

// Initialize Table (PostgreSQL syntax is slightly different)
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      location TEXT NOT NULL,
      borough TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
initDb();

/* ── UPDATED ROUTES ── */

app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  const { type, location, borough } = req.body;
  
  // Basic validation: Don't allow empty "essential" fields
  if (!type || !location || !borough) {
    return res.status(400).json({ error: "Type, Location, and Borough are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reports (type, severity, location, borough, details) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [type, req.body.severity || 'Medium', location, borough, req.body.details]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
