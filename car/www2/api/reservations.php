<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$csvFile = dirname(__DIR__) . '/db/reservations.csv';
$colHeaders = ['예약일시', '고객명/연락처', '예약차량상세', '선택정비항목', '총견적금액'];

// ─── CSV 헬퍼 ───────────────────────────────────────────────
function readCsv($file) {
    $rows = [];
    if (!file_exists($file)) return $rows;
    $handle = fopen($file, 'r');
    $headers = null;
    while (($line = fgetcsv($handle)) !== false) {
        if ($headers === null) { $headers = $line; continue; }
        if (count(array_filter($line, fn($v) => trim($v) !== '')) === 0) continue;
        $rows[] = array_combine($headers, $line);
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
$index  = isset($_GET['index']) ? (int)$_GET['index'] : null;

if ($method === 'GET') {
    echo json_encode(readCsv($csvFile), JSON_UNESCAPED_UNICODE);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $rows = readCsv($csvFile);

    // 날짜 포맷: 한국어
    $now = new DateTime('now', new DateTimeZone('Asia/Seoul'));
    $dateStr = $now->format('Y. n. j. ') .
               ($now->format('A') === 'AM' ? 'AM' : 'PM') . ' ' .
               $now->format('g:i:s');

    $rows[] = [
        '예약일시'    => $dateStr,
        '고객명/연락처' => $data['customer'] ?? '',
        '예약차량상세'  => $data['car'] ?? '',
        '선택정비항목'  => implode(' | ', $data['items'] ?? []),
        '총견적금액'   => $data['total'] ?? '',
    ];
    writeCsv($csvFile, $rows, $colHeaders);
    http_response_code(200);
    echo json_encode(['message' => '예약이 완료되었습니다.'], JSON_UNESCAPED_UNICODE);

} elseif ($method === 'DELETE' && $index !== null) {
    $rows = readCsv($csvFile);
    if ($index < 0 || $index >= count($rows)) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        exit;
    }
    array_splice($rows, $index, 1);
    writeCsv($csvFile, $rows, $colHeaders);
    echo json_encode(['message' => '삭제 완료'], JSON_UNESCAPED_UNICODE);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
