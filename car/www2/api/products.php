<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$csvFile = dirname(__DIR__) . '/db/products.csv';
$headers = ['id', 'category', 'name', 'price'];

// ─── CSV 헬퍼 ───────────────────────────────────────────────
function readCsv($file) {
    $rows = [];
    if (!file_exists($file)) return $rows;
    $handle = fopen($file, 'r');
    $colHeaders = null;
    while (($line = fgetcsv($handle)) !== false) {
        if ($colHeaders === null) { $colHeaders = $line; continue; }
        if (count(array_filter($line, fn($v) => trim($v) !== '')) === 0) continue;
        $rows[] = array_combine($colHeaders, $line);
    }
    fclose($handle);
    return $rows;
}

function writeCsv($file, $rows, $colHeaders) {
    $handle = fopen($file, 'w');
    fputcsv($handle, $colHeaders);
    foreach ($rows as $row) {
        fputcsv($handle, array_map(fn($h) => $row[$h] ?? '', $colHeaders));
    }
    fclose($handle);
}

// ─── 라우팅 ────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

if ($method === 'GET') {
    echo json_encode(readCsv($csvFile), JSON_UNESCAPED_UNICODE);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $rows = readCsv($csvFile);
    $maxId = array_reduce($rows, fn($carry, $r) => max($carry, (int)($r['id'] ?? 0)), 0);
    $new = [
        'id'       => (string)($maxId + 1),
        'category' => $data['category'] ?? 'other',
        'name'     => $data['name'] ?? '',
        'price'    => (string)($data['price'] ?? 0),
    ];
    $rows[] = $new;
    writeCsv($csvFile, $rows, $headers);
    http_response_code(201);
    echo json_encode($new, JSON_UNESCAPED_UNICODE);

} elseif ($method === 'PUT' && $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $rows = readCsv($csvFile);
    foreach ($rows as &$row) {
        if ($row['id'] === $id) {
            $row = array_merge($row, $data, ['id' => $id]);
            break;
        }
    }
    unset($row);
    writeCsv($csvFile, $rows, $headers);
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);

} elseif ($method === 'DELETE' && $id) {
    $rows = readCsv($csvFile);
    $rows = array_values(array_filter($rows, fn($r) => $r['id'] !== $id));
    writeCsv($csvFile, $rows, $headers);
    echo json_encode(['message' => '삭제 완료'], JSON_UNESCAPED_UNICODE);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
