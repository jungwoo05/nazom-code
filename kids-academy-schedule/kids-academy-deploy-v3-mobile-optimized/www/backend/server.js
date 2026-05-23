import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// Serve static files from the built frontend (now at www root)
const wwwPath = path.join(__dirname, '..');
app.use(express.static(wwwPath));

// API routes are defined below...


// Initialize DB if not exists
async function initDB() {
  try {
    await fs.access(dbPath);
  } catch (err) {
    const defaultData = {
      children: [{ id: 'child-1', name: '첫째 자녀' }],
      schedules: { 'child-1': [] }
    };
    await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

// GET all data
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to read db.json:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Save (POST) all data
app.post('/api/data', async (req, res) => {
  try {
    const { children, schedules } = req.body;
    const newData = { children, schedules };
    await fs.writeFile(dbPath, JSON.stringify(newData, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to write to db.json:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// SPA fallback - all unmatched routes serve index.html
app.use((req, res) => {
  res.sendFile(path.join(wwwPath, 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
  });
});
