<?php
/**
 * PAEAT - API de Repartidores (Gestión de Personal de Entrega)
 */

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // 1. OBTENER LISTA DE REPARTIDORES (GET)
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, nombre_completo AS fullName, numero_documento AS documentNumber, avatar_url AS avatarUrl, fecha_creacion AS createdAt FROM repartidores ORDER BY nombre_completo ASC");
        $repartidores = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'data' => $repartidores
        ]);
        exit();
    }

    // 2. CREAR / ACTUALIZAR REPARTIDOR (POST / PUT)
    if ($method === 'POST' || $method === 'PUT') {
        $input = getJsonInput();
        $id = $input['id'] ?? null;
        $fullName = trim($input['fullName'] ?? '');
        $documentNumber = trim($input['documentNumber'] ?? '');
        $password = trim($input['password'] ?? '');
        $avatarUrl = trim($input['avatarUrl'] ?? '');

        if (empty($fullName) || empty($documentNumber)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Nombre completo y número de documento son obligatorios.']);
            exit();
        }

        if ($id) {
            // Actualizar repartidor existente
            if (!empty($password)) {
                $passwordHash = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $pdo->prepare("UPDATE repartidores SET nombre_completo = ?, numero_documento = ?, password_hash = ?, avatar_url = ? WHERE id = ?");
                $stmt->execute([$fullName, $documentNumber, $passwordHash, $avatarUrl, $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE repartidores SET nombre_completo = ?, numero_documento = ?, avatar_url = ? WHERE id = ?");
                $stmt->execute([$fullName, $documentNumber, $avatarUrl, $id]);
            }

            echo json_encode([
                'status' => 'success',
                'message' => 'Repartidor actualizado correctamente.',
                'data' => ['id' => $id, 'fullName' => $fullName, 'documentNumber' => $documentNumber]
            ]);
            exit();
        } else {
            // Crear nuevo repartidor
            $newId = 'rep-' . uniqid();
            $defaultPass = !empty($password) ? $password : $documentNumber;
            $passwordHash = password_hash($defaultPass, PASSWORD_BCRYPT);

            $stmt = $pdo->prepare("INSERT INTO repartidores (id, nombre_completo, numero_documento, password_hash, avatar_url) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$newId, $fullName, $documentNumber, $passwordHash, $avatarUrl]);

            echo json_encode([
                'status' => 'success',
                'message' => 'Nuevo repartidor registrado exitosamente.',
                'data' => [
                    'id' => $newId,
                    'fullName' => $fullName,
                    'documentNumber' => $documentNumber,
                    'avatarUrl' => $avatarUrl
                ]
            ]);
            exit();
        }
    }

    // 3. ELIMINAR REPARTIDOR (DELETE)
    if ($method === 'DELETE') {
        $input = getJsonInput();
        $id = $_GET['id'] ?? $input['id'] ?? '';

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'El id del repartidor es obligatorio.']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM repartidores WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Repartidor eliminado de la base de datos.',
            'deletedId' => $id
        ]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no soportado.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error en API Repartidores: ' . $e->getMessage()]);
}
