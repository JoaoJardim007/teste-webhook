<?php
// Habilita o log de erros para um arquivo, útil para debug em produção
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log'); // Garanta que esta pasta/arquivo seja gravável pelo servidor web

header('Content-Type: application/json');

// Permite requisições de qualquer origem (para desenvolvimento). 
// Em produção, restrinja para o seu domínio: header('Access-Control-Allow-Origin: https://seudominio.pt');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Apenas POST requests são permitidos.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Dados JSON inválidos.']);
    exit;
}

// Validação básica dos campos obrigatórios
$nome = filter_var(trim($input['nome'] ?? ''), FILTER_SANITIZE_STRING);
$telefone = preg_replace('/[^0-9]/', '', $input['telefone'] ?? ''); // Remove non-digits
$email = filter_var(trim($input['email'] ?? ''), FILTER_SANITIZE_EMAIL);

if (empty($nome) || empty($telefone) || !preg_match('/^9[0-9]{8}$/', $telefone)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nome e telefone (formato 9xxxxxxxx) são obrigatórios.']);
    exit;
}
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Email inválido.']);
    exit;
}

// --- CONFIGURAÇÕES ---
$meta_access_token = 'EAADxJ29z95oBO1nvg9of52W3bwISModX20OlRji9K51meit0hU5q21FEH9cZCUarnmIsuHiyoCsPwVRPO0eu9i8XQatCXo0EuKBBVCZBGAAkuo52xWArxbk3w5fYMJQw3PJoBbGSDTiberNluZA0ZAC7P1FekQOO5Hb8y4Wdw3RqEvXdmVQ1UBMl6z7rLv8sAwZDZD'; // O SEU ACCESS TOKEN DA META
$meta_pixel_id = '626594113173742'; // O SEU PIXEL ID
$n8n_webhook_url = 'https://webhooks.automatizesolucoes.com/webhook/87ef3ff7-d81c-425c-afd7-a229e7d9ab12'; // O SEU WEBHOOK URL (N8N, ZAPIER, etc.)

$event_time = time();
$event_id = 'lead_' . $event_time . '_' . bin2hex(random_bytes(4)); // Unique event ID

// Dados do utilizador para Meta CAPI (hasheados do lado do servidor)
$user_data = [
    'ph' => [hash('sha256', $telefone)], // Telefone
    'client_ip_address' => $_SERVER['REMOTE_ADDR'],
    'client_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'fbc' => $input['fbc'] ?? null, // Facebook Click ID
    'fbp' => $input['fbp'] ?? null, // Facebook Browser ID
];
if (!empty($email)) {
    $user_data['em'] = [hash('sha256', strtolower($email))]; // Email
}
// Remover chaves nulas de fbc e fbp
$user_data = array_filter($user_data, function($value) { return !is_null($value); });


$meta_payload = [
    'data' => [
        [
            'event_name' => 'Lead',
            'event_time' => $event_time,
            'event_id' => $event_id,
            'action_source' => 'website',
            'event_source_url' => $input['page_url'] ?? null,
            'user_data' => $user_data,
            'custom_data' => [
                'content_name' => 'EDP Solar Form Submission',
                'lead_source' => 'Website Landing Page',
                'form_nome' => $nome, // Enviar dados não hasheados para custom_data se útil
                'form_telefone' => $telefone,
                'form_email' => $email,
                'value' => 1.00, // Valor simbólico do lead
                'currency' => 'EUR',
            ],
        ],
    ],
    // 'test_event_code' => 'TESTXXXXX' // Remova ou comente em produção
];

// --- Enviar para Meta Conversions API ---
$ch_meta = curl_init();
curl_setopt($ch_meta, CURLOPT_URL, "https://graph.facebook.com/v19.0/{$meta_pixel_id}/events?access_token={$meta_access_token}");
curl_setopt($ch_meta, CURLOPT_POST, 1);
curl_setopt($ch_meta, CURLOPT_POSTFIELDS, json_encode($meta_payload));
curl_setopt($ch_meta, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch_meta, CURLOPT_RETURNTRANSFER, true);
$meta_response_body = curl_exec($ch_meta);
$meta_http_code = curl_getinfo($ch_meta, CURLINFO_HTTP_CODE);
curl_close($ch_meta);

$meta_success = ($meta_http_code === 200);


// --- Enviar para Webhook (N8N, Zapier, etc.) ---
$webhook_payload = [
    'nome' => $nome,
    'telefone' => $telefone,
    'email' => $email,
    'origem' => 'EDP Solar Landing Page',
    'timestamp_iso' => $input['timestamp'] ?? date('c'),
    'pagina_origem' => $input['page_url'] ?? null,
    'ip_cliente' => $_SERVER['REMOTE_ADDR'],
    'event_id_meta' => $event_id,
    'meta_api_success' => $meta_success,
];

$ch_webhook = curl_init();
curl_setopt($ch_webhook, CURLOPT_URL, $n8n_webhook_url);
curl_setopt($ch_webhook, CURLOPT_POST, 1);
curl_setopt($ch_webhook, CURLOPT_POSTFIELDS, json_encode($webhook_payload));
curl_setopt($ch_webhook, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch_webhook, CURLOPT_RETURNTRANSFER, true);
$webhook_response_body = curl_exec($ch_webhook);
$webhook_http_code = curl_getinfo($ch_webhook, CURLINFO_HTTP_CODE);
curl_close($ch_webhook);

$webhook_success = ($webhook_http_code >= 200 && $webhook_http_code < 300);


// --- Resposta Final ---
if ($meta_success || $webhook_success) { // Considerar sucesso se pelo menos um funcionar
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Lead processado.',
        'meta_api_status' => $meta_success ? 'enviado' : 'falhou (' . $meta_http_code . ')',
        'webhook_status' => $webhook_success ? 'enviado' : 'falhou (' . $webhook_http_code . ')',
        // 'meta_response' => json_decode($meta_response_body, true), // Para debug
        // 'webhook_response' => json_decode($webhook_response_body, true) // Para debug
    ]);
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'status' => 'error',
        'message' => 'Falha ao processar o lead em todos os sistemas.',
        'meta_api_status' => 'falhou (' . $meta_http_code . ')',
        'webhook_status' => 'falhou (' . $webhook_http_code . ')',
        // 'meta_response_body' => $meta_response_body, // Para debug
        // 'webhook_response_body' => $webhook_response_body, // Para debug
    ]);
}
?>