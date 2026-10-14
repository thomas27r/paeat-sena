-- ==============================================================================
-- PAEAT - Programa de Alimentación Escolar (Base de Datos Relacional SQL)
-- Script de Creación de Estructura de Tablas y Datos Iniciales
-- Compatible con MySQL / MariaDB / PostgreSQL
-- ==============================================================================

-- Crear base de datos (Opcional)
CREATE DATABASE IF NOT EXISTS paeat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE paeat_db;

-- ==============================================================================
-- 1. TABLA: administradores
-- Almacena las cuentas de usuario con privilegios de administración del sistema.
-- ==============================================================================
DROP TABLE IF EXISTS entregas;
DROP TABLE IF EXISTS pqrs;
DROP TABLE IF EXISTS estudiantes;
DROP TABLE IF EXISTS repartidores;
DROP TABLE IF EXISTS administradores;

CREATE TABLE administradores (
    id VARCHAR(50) PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    numero_documento VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. TABLA: repartidores
-- Almacena el personal encargado de la distribución y marcado de refrigerios.
-- ==============================================================================
CREATE TABLE repartidores (
    id VARCHAR(50) PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    numero_documento VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. TABLA: estudiantes
-- Registro general de los estudiantes beneficiarios del PAEAT.
-- ==============================================================================
CREATE TABLE estudiantes (
    id VARCHAR(50) PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    numero_documento VARCHAR(50) UNIQUE NOT NULL,
    grado VARCHAR(10) NOT NULL COMMENT 'Grado escolar: 6, 7, 8, 9, 10, 11',
    estado_entrega VARCHAR(20) NOT NULL DEFAULT 'Pendiente' COMMENT 'Valores: Recibido, Pendiente',
    fecha_hora_entrega DATETIME NULL,
    avatar_url TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_estudiantes_grado (grado),
    INDEX idx_estudiantes_estado (estado_entrega)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 4. TABLA: entregas (Historial diario de entregas)
-- Registra cada entrega de refrigerio efectuada con fecha, hora y responsable.
-- ==============================================================================
CREATE TABLE entregas (
    id VARCHAR(50) PRIMARY KEY,
    estudiante_id VARCHAR(50) NOT NULL,
    repartidor_id VARCHAR(50) NULL,
    fecha_entrega DATE NOT NULL,
    hora_entrega TIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Recibido',
    observaciones TEXT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
    FOREIGN KEY (repartidor_id) REFERENCES repartidores(id) ON DELETE SET NULL,
    INDEX idx_entregas_fecha (fecha_entrega),
    INDEX idx_entregas_estudiante (estudiante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. TABLA: pqrs (Peticiones, Quejas, Reclamos y Sugerencias)
-- Mensajes enviados desde el portal público por la comunidad educativa.
-- ==============================================================================
CREATE TABLE pqrs (
    id VARCHAR(50) PRIMARY KEY,
    email_remitente VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'enviado' COMMENT 'Valores: enviado, leido',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pqrs_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- INSERCIÓN DE DATOS INICIALES (SEMILLA / SEED DATA)
-- ==============================================================================

-- Cuentas Administradores
INSERT INTO administradores (id, nombre_completo, numero_documento, email, password_hash, avatar_url) VALUES
('admin-1', 'Thomas Marin', '1140065530', 'tom.marin27@gmail.com', 'Thomas27', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'),
('admin-2', 'Joel Mendoza', '1140066076', 'estivenballesteros29@gmail.com', 'Joel29', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80');

-- Personal Repartidor
INSERT INTO repartidores (id, nombre_completo, numero_documento, password_hash, avatar_url) VALUES
('rep-1', 'Estefania Quintero', '1140065531', '1140065530', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'),
('rep-2', 'Xiomara Cardona', '1140066071', '1140066076', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80');

-- Estudiantes (Muestra de Semilla)
INSERT INTO estudiantes (id, nombre_completo, numero_documento, grado, estado_entrega, fecha_hora_entrega, avatar_url) VALUES
('st-1', 'Juan Esteban Gómez López', '1012345001', '6', 'Recibido', '2026-07-29 08:10:00', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80'),
('st-2', 'Mariana Sofia Torres Ruiz', '1012345002', '6', 'Pendiente', NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'),
('st-3', 'Carlos Andrés Rodríguez Patiño', '1012345003', '6', 'Recibido', '2026-07-29 08:15:00', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'),
('st-4', 'Valentina Restrepo Morales', '1012345004', '6', 'Pendiente', NULL, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'),
('st-10', 'Santiago Mateo Castro Díaz', '1012345010', '7', 'Recibido', '2026-07-29 08:30:00', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80'),
('st-11', 'Camila Andrea Vargas Moreno', '1012345011', '7', 'Pendiente', NULL, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80'),
('st-19', 'Daniel Alejandro Mendoza Parra', '1012345019', '8', 'Recibido', '2026-07-29 08:48:00', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'),
('st-27', 'Nicolás Felipe Gutiérrez Vega', '1012345027', '9', 'Recibido', '2026-07-29 09:02:00', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80'),
('st-35', 'Lucía Fernanda Herrera Ramos', '1012345035', '10', 'Pendiente', NULL, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80'),
('st-43', 'Mateo David Silva Ospina', '1012345043', '11', 'Recibido', '2026-07-29 09:32:00', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80');

-- PQR Inicial de Ejemplo
INSERT INTO pqrs (id, email_remitente, mensaje, estado) VALUES
('pqr-1', 'acudiente.perez@gmail.com', 'Buenas tardes, quisiera consultar la disponibilidad de raciones especiales para estudiantes con alergia a la lactosa.', 'enviado'),
('pqr-2', 'docente.rodriguez@colegio.edu.co', 'Sugerimos ajustar la hora de entrega en el grado 8 para que no se cruce con el segundo bloque de clase.', 'leido');
