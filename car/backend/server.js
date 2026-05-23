import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const productsFile = path.join(__dirname, 'db', 'products.csv');
const reservationsFile = path.join(__dirname, 'db', 'reservations.csv');
const postsFile = path.join(__dirname, 'db', 'posts.csv');

// ─── Helpers ───────────────────────────────────────────────
const readCsv = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    if (!fs.existsSync(filePath)) return resolve([]);
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (d) => {
        // skip completely empty rows
        const hasData = Object.values(d).some(v => v && v.trim() !== '');
        if (hasData) rows.push(d);
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });

const writeProducts = async (products) => {
  const writer = createObjectCsvWriter({
    path: productsFile,
    header: [
      { id: 'id', title: 'id' },
      { id: '브랜드', title: '브랜드' },
      { id: '차종', title: '차종' },
      { id: '연식', title: '연식' },
      { id: '세부모델', title: '세부모델' },
      { id: 'category', title: 'category' },
      { id: 'name', title: 'name' },
      { id: 'price', title: 'price' },
    ],
  });
  await writer.writeRecords(products);
};

const writeReservations = async (reservations) => {
  const writer = createObjectCsvWriter({
    path: reservationsFile,
    header: [
      { id: '예약일시', title: '예약일시' },
      { id: '고객명/연락처', title: '고객명/연락처' },
      { id: '예약차량상세', title: '예약차량상세' },
      { id: '선택정비항목', title: '선택정비항목' },
      { id: '총견적금액', title: '총견적금액' },
    ],
  });
  await writer.writeRecords(reservations);
};

const writePosts = async (posts) => {
  const writer = createObjectCsvWriter({
    path: postsFile,
    header: [
      { id: 'id', title: 'id' },
      { id: 'date', title: 'date' },
      { id: 'title', title: 'title' },
      { id: 'content', title: 'content' },
      { id: 'isPopup', title: 'isPopup' },
    ],
  });
  await writer.writeRecords(posts);
};

// ─── Products API ───────────────────────────────────────────

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await readCsv(productsFile);
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create product
app.post('/api/products', async (req, res) => {
  try {
    const products = await readCsv(productsFile);
    const maxId = products.reduce((m, p) => Math.max(m, parseInt(p.id) || 0), 0);
    const newProduct = {
      id: String(maxId + 1),
      '브랜드': req.body['브랜드'] || '',
      '차종': req.body['차종'] || '',
      '연식': req.body['연식'] || '',
      '세부모델': req.body['세부모델'] || '',
      category: req.body.category || 'other',
      name: req.body.name,
      price: String(req.body.price ?? 0),
    };
    products.push(newProduct);
    await writeProducts(products);
    res.status(201).json(newProduct);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const products = await readCsv(productsFile);
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    products[idx] = { ...products[idx], ...req.body, id: req.params.id };
    await writeProducts(products);
    res.json(products[idx]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST batch upload products (Upsert: Update existing, Insert new, preserve others)
app.post('/api/products/upload', async (req, res) => {
  try {
    const newItems = req.body;
    if (!Array.isArray(newItems)) {
      return res.status(400).json({ error: '데이터는 배열 형태여야 합니다.' });
    }

    // Backup current products.csv
    if (fs.existsSync(productsFile)) {
      const backupFile = `${productsFile}.bak`;
      fs.copyFileSync(productsFile, backupFile);
    }

    const currentProducts = await readCsv(productsFile);

    // Helper to find index of existing item
    const findExistingIndex = (item) => {
      const brand = (item['브랜드'] || item['brand'] || '').trim();
      const model = (item['차종'] || item['model'] || '').trim();
      const year = String(item['연식'] || item['year'] || '').trim();
      const detailedModel = (item['세부모델'] || item['detailedModel'] || '').trim();
      const category = (item.category || 'other').trim();
      const name = (item.name || '').trim();

      // 1. Try matching by ID first
      if (item.id) {
        const idx = currentProducts.findIndex(p => p.id === String(item.id).trim());
        if (idx !== -1) return idx;
      }

      // 2. Try matching by specifications + name to prevent duplicate creation
      return currentProducts.findIndex(p => 
        p['브랜드'].trim() === brand &&
        p['차종'].trim() === model &&
        String(p['연식']).trim() === year &&
        p['세부모델'].trim() === detailedModel &&
        p.category.trim() === category &&
        p.name.trim() === name
      );
    };

    let maxId = currentProducts.reduce((m, p) => Math.max(m, parseInt(p.id) || 0), 0);
    let updatedCount = 0;
    let addedCount = 0;

    for (const item of newItems) {
      const name = (item.name || '').trim();
      if (!name) continue;

      const idx = findExistingIndex(item);
      const sanitizedItem = {
        '브랜드': (item['브랜드'] || item['brand'] || '').trim(),
        '차종': (item['차종'] || item['model'] || '').trim(),
        '연식': String(item['연식'] || item['year'] || '').trim(),
        '세부모델': (item['세부모델'] || item['detailedModel'] || '').trim(),
        category: (item.category || 'other').trim(),
        name: name,
        price: String(item.price ?? 0).trim(),
      };

      if (idx !== -1) {
        // Update existing item
        currentProducts[idx] = { ...currentProducts[idx], ...sanitizedItem };
        updatedCount++;
      } else {
        // Add new item
        maxId++;
        currentProducts.push({
          ...sanitizedItem,
          id: String(maxId)
        });
        addedCount++;
      }
    }

    // Write to CSV
    await writeProducts(currentProducts);
    res.json({ 
      message: '일괄 업로드가 성공적으로 완료되었습니다.', 
      updated: updatedCount, 
      added: addedCount,
      total: currentProducts.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE product
app.delete('/api/products/:id', async (req, res) => {
  console.log(`[DELETE] Product ID: ${req.params.id}`);
  try {
    const products = await readCsv(productsFile);
    const filtered = products.filter((p) => p.id !== req.params.id);
    await writeProducts(filtered);
    res.json({ message: '삭제 완료' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Reservations API ───────────────────────────────────────

// GET all reservations
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await readCsv(reservationsFile);
    res.json(reservations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST save reservation (append)
app.post('/api/reservations', async (req, res) => {
  try {
    const { customer, car, items, total } = req.body;
    const existing = await readCsv(reservationsFile);
    const newRow = {
      '예약일시': new Date().toLocaleString('ko-KR'),
      '고객명/연락처': customer,
      '예약차량상세': car,
      '선택정비항목': items.join(' | '),
      '총견적금액': total,
    };
    existing.push(newRow);
    await writeReservations(existing);
    res.status(200).json({ message: '예약이 완료되었습니다.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE reservation by index
app.delete('/api/reservations/:index', async (req, res) => {
  console.log(`[DELETE] Reservation Index: ${req.params.index}`);
  try {
    const reservations = await readCsv(reservationsFile);
    const idx = parseInt(req.params.index);
    if (idx < 0 || idx >= reservations.length) return res.status(404).json({ error: 'Not found' });
    reservations.splice(idx, 1);
    await writeReservations(reservations);
    res.json({ message: '삭제 완료' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Posts API ─────────────────────────────────────────────

// GET all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await readCsv(postsFile);
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create post
app.post('/api/posts', async (req, res) => {
  try {
    const posts = await readCsv(postsFile);
    const maxId = posts.reduce((m, p) => Math.max(m, parseInt(p.id) || 0), 0);
    const newPost = {
      id: String(maxId + 1),
      date: new Date().toLocaleDateString('ko-KR').replace(/ /g, ''),
      title: req.body.title,
      content: req.body.content,
      isPopup: req.body.isPopup ? 'true' : 'false',
    };
    posts.unshift(newPost); // Add to top
    await writePosts(posts);
    res.status(201).json(newPost);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const posts = await readCsv(postsFile);
    const idx = posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    // If setting this one to popup, toggle others off (only one popup allowed for simplicity)
    if (req.body.isPopup === true || req.body.isPopup === 'true') {
      posts.forEach(p => p.isPopup = 'false');
    }

    posts[idx] = {
      ...posts[idx],
      ...req.body,
      id: req.params.id,
      isPopup: req.body.isPopup !== undefined ? String(req.body.isPopup) : posts[idx].isPopup
    };
    await writePosts(posts);
    res.json(posts[idx]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE post
app.delete('/api/posts/:id', async (req, res) => {
  console.log(`[DELETE] Post ID: ${req.params.id}`);
  try {
    const posts = await readCsv(postsFile);
    const filtered = posts.filter((p) => p.id !== req.params.id);
    await writePosts(filtered);
    res.json({ message: '삭제 완료' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`✅ Backend API Server running on http://localhost:${PORT}`));
