<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$csvFile    = dirname(__DIR__) . '/db/posts.csv';
$colHeaders = ['id', 'date', 'title', 'content', 'isPopup'];

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
$id     = $_GET['id'] ?? null;

if ($method === 'GET') {
    echo json_encode(readCsv($csvFile), JSON_UNESCAPED_UNICODE);

} elseif ($method === 'POST') {
    $data  = json_decode(file_get_contents('php://input'), true);
    $posts = readCsv($csvFile);
    $maxId = array_reduce($posts, fn($carry, $r) => max($carry, (int)($r['id'] ?? 0)), 0);

    $now = new DateTime('now', new DateTimeZone('Asia/Seoul'));
    $new = [
        'id'      => (string)($maxId + 1),
        'date'    => $now->format('Y.n.j.'),
        'title'   => $data['title'] ?? '',
        'content' => $data['content'] ?? '',
        'isPopup' => ($data['isPopup'] ?? false) ? 'true' : 'false',
    ];
    array_unshift($posts, $new); // 최신 글을 맨 위로
    writeCsv($csvFile, $posts, $colHeaders);
    http_response_code(201);
    echo json_encode($new, JSON_UNESCAPED_UNICODE);

} elseif ($method === 'PUT' && $id) {
    $data  = json_decode(file_get_contents('php://input'), true);
    $posts = readCsv($csvFile);

    // 팝업 설정 시 기존 팝업 모두 해제
    if (($data['isPopup'] ?? false) === true || ($data['isPopup'] ?? '') === 'true') {
        foreach ($posts as &$p) { $p['isPopup'] = 'false'; }
        unset($p);
    }

    foreach ($posts as &$post) {
        if ($post['id'] === $id) {
            $post = array_merge($post, $data, ['id' => $id]);
            if (isset($data['isPopup'])) {
                $post['isPopup'] = ($data['isPopup'] === true || $data['isPopup'] === 'true') ? 'true' : 'false';
            }
            break;
        }
    }
    unset($post);
    writeCsv($csvFile, $posts, $colHeaders);
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);

} elseif ($method === 'DELETE' && $id) {
    $posts = readCsv($csvFile);
    $posts = array_values(array_filter($posts, fn($p) => $p['id'] !== $id));
    writeCsv($csvFile, $posts, $colHeaders);
    echo json_encode(['message' => '삭제 완료'], JSON_UNESCAPED_UNICODE);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
