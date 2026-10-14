<?php
/**
 * PAEAT - API de PQRs (Creación, Consulta, Cambio de Estado y Eliminación)
 */

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // 1. OBTENER TODAS LAS PQRS (GET)
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, email_remitente AS senderEmail, mensaje AS message, estado AS status, fecha_creacion AS createdAt FROM pqrs ORDER BY fecha_creacion DESC");
        $pqrs = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'data' => $pqrs
        ]);
        exit();
    }

    // 2. CREAR PQR (POST)
    if ($method === 'POST') {
        $input = getJsonInput();
        $email = trim($input['senderEmail'] ?? $input['email'] ?? '');
        $mensaje = trim($input['message'] ?? $input['mensaje'] ?? '');

        if (empty($email) || empty($mensaje)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Email y mensaje son obligatorios.']);
            exit();
        }

        $id = 'pqr-' . uniqid();
        $stmt = $pdo->prepare("INSERT INTO pqrs (id, email_remitente, mensaje, estado) VALUES (?, ?, ?, 'enviado')");
        $stmt->execute([$id, $email, $mensaje]);

        echo json_encode([
            'status' => 'success',
            'message' => 'PQR enviado correctamente.',
            'data' => [
                'id' => $id,
                'senderEmail' => $email,
                'message' => $mensaje,
                'status' => 'enviado'
            ]
        ]);
        exit();
    }

    // 3. ACTUALIZAR ESTADO DE PQR (PUT)
    if ($method === 'PUT') {
        $input = getJsonInput();
        $id = $input['id'] ?? '';
        $newStatus = $input['status'] ?? ''; // 'enviado' o 'leido'

        if (empty($id) || empty($newStatus)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Se requiere id y status.']);
            exit();
        }

        $stmt = $pdo->prepare("UPDATE pqrs SET estado = ? WHERE id = ?");
        $stmt->execute([$newStatus, $id]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Estado de PQR actualizado correctamente.',
            'data' => ['id' => $id, 'status' => $newStatus]
        ]);
        exit();
    }

    // 4. ELIMINAR PQR (DELETE)
    if ($method === 'DELETE') {
        $input = getJsonInput();
        $id = $_GET['id'] ?? $input['id'] ?? '';

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'El id de la PQR es obligatorio.']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM pqrs WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode([
            'status' => 'success',
            'message' => 'PQR eliminada permanentemente de la base de datos.',
            'deletedId' => $id
        ]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no soportado.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error en API PQRs: ' . $e->getMessage()]);
}
