<?php
/**
 * PAEAT - API de Estudiantes (Listado, Búsqueda, Actualización de Estado de Entrega)
 */

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $grado = $_GET['grado'] ?? null;
        $busqueda = $_GET['q'] ?? null;

        $sql = "SELECT id, nombre_completo AS fullName, numero_documento AS documentNumber, grado, estado_entrega AS status, fecha_hora_entrega AS deliveryTimestamp, avatar_url AS avatarUrl FROM estudiantes WHERE 1=1";
        $params = [];

        if (!empty($grado)) {
            $sql .= " AND grado = ?";
            $params[] = $grado;
        }

        if (!empty($busqueda)) {
            $sql .= " AND (nombre_completo LIKE ? OR numero_documento LIKE ?)";
            $params[] = "%$busqueda%";
            $params[] = "%$busqueda%";
        }

        $sql .= " ORDER BY nombre_completo ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $estudiantes = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'data' => $estudiantes
        ]);
        exit();
    }

    if ($method === 'PUT' || $method === 'POST') {
        $input = getJsonInput();
        $action = $input['action'] ?? 'update_status';

        if ($action === 'update_status') {
            $studentId = $input['id'] ?? '';
            $newStatus = $input['status'] ?? ''; // 'Recibido' o 'Pendiente'
            $repartidorId = $input['repartidor_id'] ?? null;

            if (empty($studentId) || empty($newStatus)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Faltan parámetros (id, status).']);
                exit();
            }

            $timestamp = ($newStatus === 'Recibido') ? date('Y-m-d H:i:s') : null;

            // Actualizar estado en tabla estudiantes
            $stmt = $pdo->prepare("UPDATE estudiantes SET estado_entrega = ?, fecha_hora_entrega = ? WHERE id = ?");
            $stmt->execute([$newStatus, $timestamp, $studentId]);

            // Registrar en historial de entregas si fue marcado como Recibido
            if ($newStatus === 'Recibido') {
                $entregaId = 'ent-' . uniqid();
                $fecha = date('Y-m-d');
                $hora = date('H:i:s');
                $stmtHist = $pdo->prepare("INSERT INTO entregas (id, estudiante_id, repartidor_id, fecha_entrega, hora_entrega, estado) VALUES (?, ?, ?, ?, ?, 'Recibido')");
                $stmtHist->execute([$entregaId, $studentId, $repartidorId, $fecha, $hora]);
            }

            echo json_encode([
                'status' => 'success',
                'message' => 'Estado de entrega actualizado correctamente.',
                'updated' => [
                    'id' => $studentId,
                    'status' => $newStatus,
                    'deliveryTimestamp' => $timestamp
                ]
            ]);
            exit();
        }

        if ($action === 'create') {
            $id = 'st-' . uniqid();
            $fullName = trim($input['fullName'] ?? '');
            $documentNumber = trim($input['documentNumber'] ?? '');
            $grado = trim($input['grade'] ?? '');
            $avatarUrl = trim($input['avatarUrl'] ?? '');

            if (empty($fullName) || empty($documentNumber) || empty($grado)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Campos obligatorios incompletos.']);
                exit();
            }

            $stmt = $pdo->prepare("INSERT INTO estudiantes (id, nombre_completo, numero_documento, grado, estado_entrega, avatar_url) VALUES (?, ?, ?, ?, 'Pendiente', ?)");
            $stmt->execute([$id, $fullName, $documentNumber, $grado, $avatarUrl]);

            echo json_encode([
                'status' => 'success',
                'message' => 'Estudiante creado exitosamente.',
                'data' => [
                    'id' => $id,
                    'fullName' => $fullName,
                    'documentNumber' => $documentNumber,
                    'grade' => $grado,
                    'status' => 'Pendiente',
                    'avatarUrl' => $avatarUrl
                ]
            ]);
            exit();
        }
    }

    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no soportado.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error en API Estudiantes: ' . $e->getMessage()]);
}
