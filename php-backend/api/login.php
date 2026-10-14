<?php
/**
 * PAEAT - API de Autenticación (Login para Administradores y Repartidores)
 */

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido. Use POST.']);
    exit();
}

$input = getJsonInput();
$role = $input['role'] ?? '';
$documento = trim($input['documento'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($role) || empty($documento) || empty($password)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Faltan datos obligatorios (role, documento, password).']);
    exit();
}

try {
    if ($role === 'admin') {
        $stmt = $pdo->prepare("SELECT id, nombre_completo, numero_documento, email, password_hash, avatar_url FROM administradores WHERE numero_documento = ?");
        $stmt->execute([$documento]);
        $user = $stmt->fetch();

        // En producción se recomienda password_verify($password, $user['password_hash'])
        if ($user && ($user['password_hash'] === $password || password_verify($password, $user['password_hash']))) {
            echo json_encode([
                'status' => 'success',
                'user' => [
                    'role' => 'admin',
                    'fullName' => $user['nombre_completo'],
                    'documentNumber' => $user['numero_documento'],
                    'email' => $user['email'],
                    'avatarUrl' => $user['avatar_url']
                ]
            ]);
            exit();
        }
    } else if ($role === 'repartidor') {
        $stmt = $pdo->prepare("SELECT id, nombre_completo, numero_documento, password_hash, avatar_url FROM repartidores WHERE numero_documento = ?");
        $stmt->execute([$documento]);
        $user = $stmt->fetch();

        if ($user && ($user['password_hash'] === $password || password_verify($password, $user['password_hash']))) {
            echo json_encode([
                'status' => 'success',
                'user' => [
                    'role' => 'repartidor',
                    'fullName' => $user['nombre_completo'],
                    'documentNumber' => $user['numero_documento'],
                    'avatarUrl' => $user['avatar_url']
                ]
            ]);
            exit();
        }
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Rol inválido. Debe ser admin o repartidor.']);
        exit();
    }

    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Documento o contraseña incorrectos.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error en consulta de login: ' . $e->getMessage()]);
}
