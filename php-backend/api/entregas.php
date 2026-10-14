<?php
/**
 * PAEAT - API de Entregas e Historial Diario (Cierre de Jornada y Consultas)
 */

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // 1. OBTENER HISTORIAL DE ENTREGAS O ESTADÍSTICAS POR FECHA (GET)
    if ($method === 'GET') {
        $fecha = $_GET['fecha'] ?? null;

        if ($fecha) {
            $stmt = $pdo->prepare("SELECT e.id, e.fecha_entrega AS fecha, e.hora_entrega AS hora, e.estado, st.nombre_completo AS estudiante, st.grado, r.nombre_completo AS repartidor FROM entregas e LEFT JOIN estudiantes st ON e.estudiante_id = st.id LEFT JOIN repartidores r ON e.repartidor_id = r.id WHERE e.fecha_entrega = ? ORDER BY e.hora_entrega DESC");
            $stmt->execute([$fecha]);
            $entregas = $stmt->fetchAll();

            echo json_encode([
                'status' => 'success',
                'fecha' => $fecha,
                'data' => $entregas
            ]);
            exit();
        }

        // Historial general agrupado por fecha
        $stmt = $pdo->query("SELECT fecha_entrega AS fecha, COUNT(*) AS total_entregados FROM entregas GROUP BY fecha_entrega ORDER BY fecha_entrega DESC");
        $historial = $stmt->fetchAll();

        echo json_encode([
            'status' => 'success',
            'data' => $historial
        ]);
        exit();
    }

    // 2. REINICIAR JORNADA Y GUARDAR HISTÓRICO (POST)
    if ($method === 'POST') {
        $input = getJsonInput();
        $action = $input['action'] ?? 'reset_jornada';

        if ($action === 'reset_jornada') {
            $fechaActual = date('Y-m-d');

            // 1. Respaldar estudiantes recibidos en la tabla entregas si no se han registrado
            $stmtPendientes = $pdo->query("SELECT id FROM estudiantes WHERE estado_entrega = 'Recibido'");
            $recibidos = $stmtPendientes->fetchAll();

            $hora = date('H:i:s');
            $stmtInsert = $pdo->prepare("INSERT INTO entregas (id, estudiante_id, fecha_entrega, hora_entrega, estado) VALUES (?, ?, ?, ?, 'Recibido')");

            foreach ($recibidos as $row) {
                $idEnt = 'ent-' . uniqid();
                $stmtInsert->execute([$idEnt, $row['id'], $fechaActual, $hora]);
            }

            // 2. Reiniciar todos los estudiantes a 'Pendiente' para la nueva jornada
            $pdo->exec("UPDATE estudiantes SET estado_entrega = 'Pendiente', fecha_hora_entrega = NULL");

            echo json_encode([
                'status' => 'success',
                'message' => 'Jornada escolar cerrada e historial respaldado exitosamente.',
                'fechaCierre' => $fechaActual,
                'totalRespaldados' => count($recibidos)
            ]);
            exit();
        }
    }

    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no soportado.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error en API Entregas: ' . $e->getMessage()]);
}
