<?php
/**
 * EDP Solar - Lead Processing & Meta CAPI Integration
 * Optimized for High Conversion Tracking & Data Security
 * @version 2.0
 */

// ==================== SECURITY & ERROR HANDLING ====================
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/php-errors.log');
error_reporting(E_ALL);

// Create logs directory if it doesn't exist
if (!is_dir(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0755, true);
}

// Security Headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// CORS Configuration (adjust for production)
$allowed_origins = [
    'https://edpsolar.com.pt',
    'https://www.edpsolar.com.pt',
    'http://localhost:3000', // Remove in production
    'http://127.0.0.1:8000'  // Remove in production
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: https://edpsolar.com.pt'); // Default fallback
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método não permitido. Apenas POST requests são aceites.',
        'allowed_methods' => ['POST']
    ]);
    exit;
}

// ==================== CONFIGURATION ====================
class LeadConfig {
    // Meta Pixel Configuration
    const META_ACCESS_TOKEN = 'EAADxJ29z95oBO1nvg9of52W3bwISModX20OlRji9K51meit0hU5q21FEH9cZCUarnmIsuHiyoCsPwVRPO0eu9i8XQatCXo0EuKBBVCZBGAAkuo52xWArxbk3w5fYMJQw3PJoBbGSDTiberNluZA0ZAC7P1FekQOO5Hb8y4Wdw3RqEvXdmVQ1UBMl6z7rLv8sAwZDZD';
    const META_PIXEL_ID = '626594113173742';
    
    // Webhook Configuration (N8N, Zapier, Make, etc.)
    const WEBHOOK_URL = 'https://webhooks.automatizesolucoes.com/webhook/87ef3ff7-d81c-425c-afd7-a229e7d9ab12';
    
    // CRM Integration (Optional)
    const CRM_API_URL = null; // Set your CRM API URL here
    const CRM_API_KEY = null; // Set your CRM API key here
    
    // Email Configuration (Optional)
    const SMTP_HOST = 'smtp.gmail.com';
    const SMTP_PORT = 587;
    const SMTP_USERNAME = 'notifications@edpsolar.com.pt';
    const SMTP_PASSWORD = ''; // Set your email password
    
    // Rate Limiting
    const MAX_REQUESTS_PER_IP = 10; // Per hour
    const MAX_REQUESTS_PER_EMAIL = 3; // Per day
    
    // Data Retention (GDPR Compliance)
    const DATA_RETENTION_DAYS = 30;
    
    // Test Mode (set to false in production)
    const TEST_MODE = false;
}

// ==================== RATE LIMITING & SECURITY ====================
class SecurityManager {
    private static function getRateLimitFile($type, $identifier) {
        $safe_identifier = preg_replace('/[^a-zA-Z0-9]/', '', $identifier);
        return __DIR__ . "/logs/rate_limit_{$type}_{$safe_identifier}.json";
    }
    
    public static function checkRateLimit($ip, $email = null) {
        // Check IP rate limit
        $ip_file = self::getRateLimitFile('ip', $ip);
        $ip_requests = self::getRequestCount($ip_file, 3600); // 1 hour
        
        if ($ip_requests >= LeadConfig::MAX_REQUESTS_PER_IP) {
            return [
                'allowed' => false,
                'message' => 'Muitas tentativas do mesmo IP. Tente novamente em 1 hora.',
                'retry_after' => 3600
            ];
        }
        
        // Check email rate limit if provided
        if ($email) {
            $email_file = self::getRateLimitFile('email', $email);
            $email_requests = self::getRequestCount($email_file, 86400); // 24 hours
            
            if ($email_requests >= LeadConfig::MAX_REQUESTS_PER_EMAIL) {
                return [
                    'allowed' => false,
                    'message' => 'Muitas tentativas com o mesmo email. Tente novamente amanhã.',
                    'retry_after' => 86400
                ];
            }
        }
        
        return ['allowed' => true];
    }
    
    private static function getRequestCount($file, $time_window) {
        if (!file_exists($file)) {
            return 0;
        }
        
        $data = json_decode(file_get_contents($file), true) ?: [];
        $current_time = time();
        $cutoff_time = $current_time - $time_window;
        
        // Clean old entries
        $data = array_filter($data, function($timestamp) use ($cutoff_time) {
            return $timestamp > $cutoff_time;
        });
        
        // Save cleaned data
        file_put_contents($file, json_encode(array_values($data)));
        
        return count($data);
    }
    
    public static function recordRequest($ip, $email = null) {
        // Record IP request
        $ip_file = self::getRateLimitFile('ip', $ip);
        $ip_data = file_exists($ip_file) ? json_decode(file_get_contents($ip_file), true) : [];
        $ip_data[] = time();
        file_put_contents($ip_file, json_encode($ip_data));
        
        // Record email request if provided
        if ($email) {
            $email_file = self::getRateLimitFile('email', $email);
            $email_data = file_exists($email_file) ? json_decode(file_get_contents($email_file), true) : [];
            $email_data[] = time();
            file_put_contents($email_file, json_encode($email_data));
        }
    }
    
    public static function validateHoneypot($data) {
        // Check for honeypot fields that should be empty
        $honeypot_fields = ['website', 'url', 'company_name', 'fax'];
        
        foreach ($honeypot_fields as $field) {
            if (!empty($data[$field])) {
                return false; // Bot detected
            }
        }
        
        return true;
    }
    
    public static function detectBot($user_agent, $request_time) {
        // Basic bot detection
        $bot_patterns = [
            '/bot/i', '/crawler/i', '/spider/i', '/scraper/i',
            '/curl/i', '/wget/i', '/python/i', '/http/i'
        ];
        
        foreach ($bot_patterns as $pattern) {
            if (preg_match($pattern, $user_agent)) {
                return true;
            }
        }
        
        // Check for unrealistic form submission time (too fast)
        if (isset($request_time) && $request_time < 5) { // Less than 5 seconds
            return true;
        }
        
        return false;
    }
}

// ==================== DATA VALIDATION ====================
class DataValidator {
    public static function validateLead($data) {
        $errors = [];
        
        // Required fields validation
        if (empty($data['nome']) || strlen(trim($data['nome'])) < 2) {
            $errors[] = 'Nome é obrigatório e deve ter pelo menos 2 caracteres';
        }
        
        if (empty($data['telefone'])) {
            $errors[] = 'Telemóvel é obrigatório';
        } else {
            $clean_phone = preg_replace('/[^0-9]/', '', $data['telefone']);
            if (!preg_match('/^9[0-9]{8}$/', $clean_phone)) {
                $errors[] = 'Telemóvel deve estar no formato 9XXXXXXXX';
            }
        }
        
        // Email validation (optional but must be valid if provided)
        if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email inválido';
        }
        
        // Privacy policy validation
        if (empty($data['privacy_policy']) || $data['privacy_policy'] !== true) {
            $errors[] = 'Deve aceitar a política de privacidade';
        }
        
        // Name validation (only letters and spaces)
        if (!empty($data['nome']) && !preg_match('/^[a-zA-ZÀ-ÿ\s]+$/u', $data['nome'])) {
            $errors[] = 'Nome deve conter apenas letras e espaços';
        }
        
        return $errors;
    }
    
    public static function sanitizeData($data) {
        return [
            'nome' => self::sanitizeString($data['nome'] ?? ''),
            'telefone' => preg_replace('/[^0-9]/', '', $data['telefone'] ?? ''),
            'email' => filter_var(trim($data['email'] ?? ''), FILTER_SANITIZE_EMAIL),
            'privacy_policy' => (bool)($data['privacy_policy'] ?? false),
            'timestamp' => $data['timestamp'] ?? date('c'),
            'page_url' => filter_var($data['page_url'] ?? '', FILTER_SANITIZE_URL),
            'fbc' => self::sanitizeString($data['fbc'] ?? ''),
            'fbp' => self::sanitizeString($data['fbp'] ?? ''),
            'lead_score' => (int)($data['lead_score'] ?? 0),
            'time_on_page' => (int)($data['time_on_page'] ?? 0),
            'scroll_depth' => (int)($data['scroll_depth'] ?? 0),
            'interactions' => (int)($data['interactions'] ?? 0),
            'user_agent' => self::sanitizeString($data['user_agent'] ?? ''),
            'screen_resolution' => self::sanitizeString($data['screen_resolution'] ?? ''),
            'referrer' => filter_var($data['referrer'] ?? '', FILTER_SANITIZE_URL),
            'utm_source' => self::sanitizeString($data['utm_source'] ?? ''),
            'utm_medium' => self::sanitizeString($data['utm_medium'] ?? ''),
            'utm_campaign' => self::sanitizeString($data['utm_campaign'] ?? '')
        ];
    }
    
    private static function sanitizeString($string) {
        return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
    }
}

// ==================== LEAD PROCESSOR ====================
class LeadProcessor {
    private $lead_data;
    private $results = [];
    
    public function __construct($lead_data) {
        $this->lead_data = $lead_data;
    }
    
    public function process() {
        try {
            // Process all integrations in parallel where possible
            $this->processMetaPixel();
            $this->processWebhook();
            $this->processCRM();
            $this->processEmail();
            $this->saveToDatabase();
            
            return [
                'status' => 'success',
                'message' => 'Lead processado com sucesso',
                'results' => $this->results,
                'lead_id' => $this->generateLeadId()
            ];
            
        } catch (Exception $e) {
            error_log("Lead processing error: " . $e->getMessage());
            
            return [
                'status' => 'partial_success',
                'message' => 'Lead recebido mas alguns serviços falharam',
                'error' => $e->getMessage(),
                'results' => $this->results
            ];
        }
    }
    
    private function processMetaPixel() {
        if (!LeadConfig::META_ACCESS_TOKEN || !LeadConfig::META_PIXEL_ID) {
            $this->results['meta_pixel'] = 'not_configured';
            return;
        }
        
        try {
            $event_time = time();
            $event_id = 'lead_' . $event_time . '_' . bin2hex(random_bytes(4));
            
            // Enhanced user data for better matching
            $user_data = [
                'ph' => [hash('sha256', $this->lead_data['telefone'])],
                'client_ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
                'client_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            ];
            
            // Add email if provided
            if (!empty($this->lead_data['email'])) {
                $user_data['em'] = [hash('sha256', strtolower($this->lead_data['email']))];
            }
            
            // Add Facebook Click ID and Browser ID if available
            if (!empty($this->lead_data['fbc'])) {
                $user_data['fbc'] = $this->lead_data['fbc'];
            }
            if (!empty($this->lead_data['fbp'])) {
                $user_data['fbp'] = $this->lead_data['fbp'];
            }
            
            // Enhanced custom data with lead scoring
            $custom_data = [
                'content_name' => 'EDP Solar Lead Generation',
                'content_category' => 'Energy/Solar',
                'lead_source' => 'Website Landing Page',
                'lead_quality_score' => $this->calculateLeadQuality(),
                'value' => max(1.0, $this->lead_data['lead_score'] / 10), // Convert lead score to value
                'currency' => 'EUR',
                'predicted_lifetime_value' => $this->predictLifetimeValue(),
                'engagement_score' => $this->calculateEngagementScore(),
                'form_completion_time' => $this->lead_data['time_on_page'],
                'page_scroll_depth' => $this->lead_data['scroll_depth'],
                'user_interactions' => $this->lead_data['interactions']
            ];
            
            $payload = [
                'data' => [[
                    'event_name' => 'Lead',
                    'event_time' => $event_time,
                    'event_id' => $event_id,
                    'action_source' => 'website',
                    'event_source_url' => $this->lead_data['page_url'],
                    'user_data' => $user_data,
                    'custom_data' => $custom_data
                ]]
            ];
            
            // Add test event code if in test mode
            if (LeadConfig::TEST_MODE) {
                $payload['test_event_code'] = 'TEST12345';
            }
            
            $response = $this->sendCurlRequest(
                "https://graph.facebook.com/v19.0/" . LeadConfig::META_PIXEL_ID . "/events?access_token=" . LeadConfig::META_ACCESS_TOKEN,
                $payload
            );
            
            $this->results['meta_pixel'] = [
                'status' => $response['success'] ? 'success' : 'failed',
                'event_id' => $event_id,
                'response_code' => $response['http_code'],
                'events_received' => $response['data']['events_received'] ?? 0
            ];
            
        } catch (Exception $e) {
            $this->results['meta_pixel'] = [
                'status' => 'error',
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function processWebhook() {
        if (!LeadConfig::WEBHOOK_URL) {
            $this->results['webhook'] = 'not_configured';
            return;
        }
        
        try {
            $webhook_data = [
                'lead_id' => $this->generateLeadId(),
                'nome' => $this->lead_data['nome'],
                'telefone' => $this->lead_data['telefone'],
                'email' => $this->lead_data['email'],
                'origem' => 'EDP Solar Landing Page',
                'timestamp_iso' => $this->lead_data['timestamp'],
                'pagina_origem' => $this->lead_data['page_url'],
                'ip_cliente' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $this->lead_data['user_agent'],
                'referrer' => $this->lead_data['referrer'],
                'lead_quality_score' => $this->calculateLeadQuality(),
                'engagement_metrics' => [
                    'time_on_page' => $this->lead_data['time_on_page'],
                    'scroll_depth' => $this->lead_data['scroll_depth'],
                    'interactions' => $this->lead_data['interactions'],
                    'lead_score' => $this->lead_data['lead_score']
                ],
                'utm_data' => [
                    'source' => $this->lead_data['utm_source'],
                    'medium' => $this->lead_data['utm_medium'],
                    'campaign' => $this->lead_data['utm_campaign']
                ],
                'device_info' => [
                    'screen_resolution' => $this->lead_data['screen_resolution'],
                    'user_agent' => $this->lead_data['user_agent']
                ]
            ];
            
            $response = $this->sendCurlRequest(LeadConfig::WEBHOOK_URL, $webhook_data);
            
            $this->results['webhook'] = [
                'status' => $response['success'] ? 'success' : 'failed',
                'response_code' => $response['http_code'],
                'response_time' => $response['response_time'] ?? 0
            ];
            
        } catch (Exception $e) {
            $this->results['webhook'] = [
                'status' => 'error',
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function processCRM() {
        if (!LeadConfig::CRM_API_URL || !LeadConfig::CRM_API_KEY) {
            $this->results['crm'] = 'not_configured';
            return;
        }
        
        // Implement CRM integration here (HubSpot, Salesforce, etc.)
        $this->results['crm'] = 'not_implemented';
    }
    
    private function processEmail() {
        if (!LeadConfig::SMTP_HOST || !LeadConfig::SMTP_USERNAME) {
            $this->results['email'] = 'not_configured';
            return;
        }
        
        try {
            // Send notification email to sales team
            $this->sendNotificationEmail();
            $this->results['email'] = 'success';
            
        } catch (Exception $e) {
            $this->results['email'] = [
                'status' => 'error',
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function saveToDatabase() {
        try {
            // Save to local JSON file (for simple storage)
            // In production, use a proper database
            $leads_file = __DIR__ . '/logs/leads.json';
            $leads = file_exists($leads_file) ? json_decode(file_get_contents($leads_file), true) : [];
            
            $lead_record = [
                'id' => $this->generateLeadId(),
                'data' => $this->lead_data,
                'timestamp' => time(),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'processing_results' => $this->results
            ];
            
            $leads[] = $lead_record;
            
            // Keep only recent leads (GDPR compliance)
            $cutoff_time = time() - (LeadConfig::DATA_RETENTION_DAYS * 86400);
            $leads = array_filter($leads, function($lead) use ($cutoff_time) {
                return $lead['timestamp'] > $cutoff_time;
            });
            
            file_put_contents($leads_file, json_encode($leads, JSON_PRETTY_PRINT));
            
            $this->results['database'] = 'success';
            
        } catch (Exception $e) {
            $this->results['database'] = [
                'status' => 'error',
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function sendCurlRequest($url, $data) {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'User-Agent: EDP-Solar-Lead-Processor/2.0'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3
        ]);
        
        $start_time = microtime(true);
        $response_body = curl_exec($ch);
        $response_time = microtime(true) - $start_time;
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL Error: $error");
        }
        
        return [
            'success' => $http_code >= 200 && $http_code < 300,
            'http_code' => $http_code,
            'body' => $response_body,
            'data' => json_decode($response_body, true) ?: [],
            'response_time' => round($response_time * 1000, 2) // Convert to milliseconds
        ];
    }
    
    private function calculateLeadQuality() {
        $score = 0;
        
        // Base score for completing form
        $score += 20;
        
        // Time on page scoring
        if ($this->lead_data['time_on_page'] > 60) $score += 15;
        if ($this->lead_data['time_on_page'] > 180) $score += 10;
        if ($this->lead_data['time_on_page'] > 300) $score += 5;
        
        // Scroll depth scoring
        if ($this->lead_data['scroll_depth'] > 50) $score += 10;
        if ($this->lead_data['scroll_depth'] > 75) $score += 10;
        if ($this->lead_data['scroll_depth'] > 90) $score += 5;
        
        // Interaction scoring
        $score += min(20, $this->lead_data['interactions'] * 2);
        
        // Lead score from frontend
        $score += min(20, $this->lead_data['lead_score'] / 5);
        
        // Email provided bonus
        if (!empty($this->lead_data['email'])) $score += 10;
        
        // Referrer scoring
        if (strpos($this->lead_data['referrer'], 'google') !== false) $score += 5;
        if (strpos($this->lead_data['referrer'], 'facebook') !== false) $score += 5;
        
        return min(100, $score);
    }
    
    private function calculateEngagementScore() {
        $engagement = 0;
        
        // Normalize metrics to 0-100 scale
        $time_score = min(100, ($this->lead_data['time_on_page'] / 300) * 100);
        $scroll_score = $this->lead_data['scroll_depth'];
        $interaction_score = min(100, ($this->lead_data['interactions'] / 20) * 100);
        
        // Weighted average
        $engagement = ($time_score * 0.4) + ($scroll_score * 0.3) + ($interaction_score * 0.3);
        
        return round($engagement);
    }
    
    private function predictLifetimeValue() {
        // Simple LTV prediction based on engagement
        $base_ltv = 1500; // Average customer value in EUR
        $quality_multiplier = $this->calculateLeadQuality() / 100;
        $engagement_multiplier = $this->calculateEngagementScore() / 100;
        
        return round($base_ltv * (($quality_multiplier + $engagement_multiplier) / 2));
    }
    
    private function generateLeadId() {
        return 'EDP-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
    }
    
    private function sendNotificationEmail() {
        // Simple email notification (implement proper SMTP if needed)
        $to = 'vendas@edpsolar.com.pt';
        $subject = '🔥 Novo Lead EDP Solar - ' . $this->lead_data['nome'];
        
        $message = "
        <h2>Novo Lead Recebido</h2>
        <p><strong>Nome:</strong> {$this->lead_data['nome']}</p>
        <p><strong>Telemóvel:</strong> {$this->lead_data['telefone']}</p>
        <p><strong>Email:</strong> {$this->lead_data['email']}</p>
        <p><strong>Qualidade do Lead:</strong> {$this->calculateLeadQuality()}/100</p>
        <p><strong>Tempo na Página:</strong> {$this->lead_data['time_on_page']} segundos</p>
        <p><strong>Profundidade de Scroll:</strong> {$this->lead_data['scroll_depth']}%</p>
        <p><strong>Hora:</strong> " . date('d/m/Y H:i:s') . "</p>
        ";
        
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: EDP Solar <noreply@edpsolar.com.pt>',
            'Reply-To: vendas@edpsolar.com.pt'
        ];
        
        // Use mail() function or implement proper SMTP
        mail($to, $subject, $message, implode("\r\n", $headers));
    }
}

// ==================== MAIN EXECUTION ====================
try {
    // Get and validate input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Dados JSON inválidos',
            'json_error' => json_last_error_msg()
        ]);
        exit;
    }
    
    // Security checks
    $client_ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // Check rate limiting
    $rate_limit_check = SecurityManager::checkRateLimit($client_ip, $input['email'] ?? null);
    if (!$rate_limit_check['allowed']) {
        http_response_code(429);
        header('Retry-After: ' . $rate_limit_check['retry_after']);
        echo json_encode([
            'status' => 'error',
            'message' => $rate_limit_check['message'],
            'retry_after' => $rate_limit_check['retry_after']
        ]);
        exit;
    }
    
    // Bot detection
    if (SecurityManager::detectBot($user_agent, $input['time_on_page'] ?? 0)) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Acesso negado'
        ]);
        exit;
    }
    
    // Honeypot validation
    if (!SecurityManager::validateHoneypot($input)) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Spam detectado'
        ]);
        exit;
    }
    
    // Data validation
    $validation_errors = DataValidator::validateLead($input);
    if (!empty($validation_errors)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Dados inválidos',
            'errors' => $validation_errors
        ]);
        exit;
    }
    
    // Sanitize data
    $clean_data = DataValidator::sanitizeData($input);
    
    // Record request for rate limiting
    SecurityManager::recordRequest($client_ip, $clean_data['email']);
    
    // Process lead
    $processor = new LeadProcessor($clean_data);
    $result = $processor->process();
    
    // Set appropriate HTTP status code
    $http_code = $result['status'] === 'success' ? 200 : 
                ($result['status'] === 'partial_success' ? 202 : 500);
    
    http_response_code($http_code);
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log("Critical error in lead processing: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erro interno do servidor. Tente novamente ou contacte-nos diretamente.',
        'support_phone' => '+351 912 345 678',
        'error_id' => bin2hex(random_bytes(8))
    ]);
}
?>