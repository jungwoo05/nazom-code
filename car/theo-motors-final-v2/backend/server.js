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

const PORT = process.env.PORT || 3001;

// backend/ 의 상위 = www/ 에 React 빌드 파일이 있음
const wwwDir     = path.join(__dirname, '..');
const productsFile     = path.join(__dirname, 'db', 'products.csv');
const reservationsFile = path.join(__dirname, 'db', 'reservations.csv');
const postsFile        = path.join(__dirname, 'db', 'posts.csv');

// db 폴더 자동 생성
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// ─── CSV 헬퍼 ───────────────────────────────────────────────
const readCsv = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    if (!fs.existsSync(filePath)) return resolve([]);
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (d) => {
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
      { id: 'id',       title: 'id' },
      { id: 'category', title: 'category' },
      { id: 'name',     title: 'name' },
      { id: 'price',    title: 'price' },
    ],
  });
  await writer.writeRecords(products);
};

const writeReservations = async (reservations) => {
  const writer = createObjectCsvWriter({
    path: reservationsFile,
    header: [
      { id: '예약일시',      title: '예약일시' },
      { id: '고객명/연락처', title: '고객명/연락처' },
      { id: '예약차량상세',  title: '예약차량상세' },
      { id: '선택정비항목',  title: '선택정비항목' },
      { id: '총견적금액',    title: '총견적금액' },
    ],
  });
  await writer.writeRecords(reservations);
};

const writePosts = async (posts) => {
  const writer = createObjectCsvWriter({
    path: postsFile,
    header: [
      { id: 'id',      title: 'id' },
      { id: 'date',    title: 'date' },
      { id: 'title',   title: 'title' },
      { id: 'content', title: 'content' },
      { id: 'isPopup', title: 'isPopup' },
    ],
  });
  await writer.writeRecords(posts);
};

// ─── Products API ───────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try { res.json(await readCsv(productsFile)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const products = await readCsv(productsFile);
    const maxId = products.reduce((m, p) => Math.max(m, parseInt(p.id) || 0), 0);
    const newProduct = { id: String(maxId + 1), category: req.body.category || 'other', name: req.body.name, price: String(req.body.price ?? 0) };
    products.push(newProduct);
    await writeProducts(products);
    res.status(201).json(newProduct);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const products = await readCsv(productsFile);
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    products[idx] = { ...products[idx], ...req.body, id: req.params.id };
    await writeProducts(products);
    res.json(products[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const products = await readCsv(productsFile);
    await writeProducts(products.filter((p) => p.id !== req.params.id));
    res.json({ message: '삭제 완료' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Reservations API ───────────────────────────────────────
app.get('/api/reservations', async (req, res) => {
  try { res.json(await readCsv(reservationsFile)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { customer, car, items, total } = req.body;
    const existing = await readCsv(reservationsFile);
    existing.push({
      '예약일시':      new Date().toLocaleString('ko-KR'),
      '고객명/연락처': customer,
      '예약차량상세':  car,
      '선택정비항목':  items.join(' | '),
      '총견적금액':    total,
    });
    await writeReservations(existing);
    res.status(200).json({ message: '예약이 완료되었습니다.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/reservations/:index', async (req, res) => {
  try {
    const reservations = await readCsv(reservationsFile);
    const idx = parseInt(req.params.index);
    if (idx < 0 || idx >= reservations.length) return res.status(404).json({ error: 'Not found' });
    reservations.splice(idx, 1);
    await writeReservations(reservations);
    res.json({ message: '삭제 완료' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Posts API ─────────────────────────────────────────────
app.get('/api/posts', async (req, res) => {
  try { res.json(await readCsv(postsFile)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

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
    posts.unshift(newPost);
    await writePosts(posts);
    res.status(201).json(newPost);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    const posts = await readCsv(postsFile);
    const idx = posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (req.body.isPopup === true || req.body.isPopup === 'true') {
      posts.forEach(p => p.isPopup = 'false');
    }
    posts[idx] = {
      ...posts[idx], ...req.body, id: req.params.id,
      isPopup: req.body.isPopup !== undefined ? String(req.body.isPopup) : posts[idx].isPopup,
    };
    await writePosts(posts);
    res.json(posts[idx]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const posts = await readCsv(postsFile);
    await writePosts(posts.filter((p) => p.id !== req.params.id));
    res.json({ message: '삭제 완료' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── 정적 파일 서빙 (www/ 루트) ─────────────────────────────
app.use(express.static(wwwDir));

// SPA fallback — API 경로 외의 모든 요청은 index.html로 보냄
app.use((req, res) => {
  res.sendFile(path.join(wwwDir, 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Theo Motors Server running on http://localhost:${PORT}`));
