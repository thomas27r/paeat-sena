<?php
/**
 * PAEAT - Configuración de Conexión a Base de Datos MySQL (PDO)
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Manejo de peticiones preflight OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = '127.0.0.1';
$db   = 'paeat_db';
$user = 'root';
$pass = ''; // Por defecto en XAMPP es vacío. En WAMP usar 'root' o vacío segun conf.
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error al conectar con la base de datos MySQL: ' . $e->getMessage()
    ]);
    exit();
}

/**
 * Función auxiliar para leer datos JSON del body de la petición
 */
function getJsonInput() {
    $rawInput = file_get_contents('php://input');
    return json_decode($rawInput, true) ?? [];
}
