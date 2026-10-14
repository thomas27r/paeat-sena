# PAEAT - Servidor Backend PHP & MySQL (Guía de Instalación Local)

Este directorio contiene la arquitectura backend del sistema **PAEAT** construida en **PHP Nativo (PDO)** con base de datos **MySQL**, lista para ejecutarse localmente mediante **XAMPP, WAMP, MAMP o Laragon**.

---

## 📁 Estructura del Proyecto PHP

```text
php-backend/
├── config/
│   └── db.php           # Conexión PDO a MySQL con UTF-8 y headers CORS
├── api/
│   ├── login.php        # Autenticación de Administradores y Repartidores
│   ├── estudiantes.php  # Consulta, creación y marcado de entregas
│   ├── repartidores.php # Gestión CRUD del personal repartidor
│   ├── entregas.php     # Cierre de jornada diario e historial de entregas
│   └── pqrs.php         # Envío, lectura, cambio de estado y eliminación de PQRs
└── README.md            # Guía de instalación y pruebas
```

---

## ⚙️ Paso 1: Requisitos Previos

1. Instalar un servidor local PHP + MySQL:
   - **XAMPP** (Recomendado para Windows/Linux/Mac): [https://www.apachefriends.org/](https://www.apachefriends.org/)
   - O **WAMP Server** / **Laragon**.
2. PHP versión 7.4 o superior (PHP 8.x recomendado).
3. MySQL 5.7+ o MariaDB 10.4+.

---

## 🗄️ Paso 2: Importar la Base de Datos en MySQL

1. Inicia **Apache** y **MySQL** desde el panel de control de XAMPP.
2. Abre tu navegador e ingresa a **phpMyAdmin**: `http://localhost/phpmyadmin/`
3. Haz clic en el botón **"Nueva"** en la barra lateral para crear una base de datos.
4. Asigna el nombre: `paeat_db` y el cotejamiento `utf8mb4_unicode_ci`.
5. Selecciona la pestaña **"Importar"** en el menú superior.
6. Haz clic en **"Seleccionar archivo"** y busca el archivo SQL del proyecto:
   `database/paeat_schema.sql`
7. Haz clic en **"Continuar"** en la parte inferior para ejecutar el script.
8. Verás creadas las 5 tablas principales:
   - `administradores`
   - `repartidores`
   - `estudiantes`
   - `entregas`
   - `pqrs`

---

## 🚀 Paso 3: Copiar Archivos PHP al Servidor Web (htdocs)

1. Copia la carpeta `php-backend` a la carpeta raíz de tu servidor web:
   - En **XAMPP**: `C:\xampp\htdocs\paeat-backend\`
   - En **WAMP**: `C:\wamp64\www\paeat-backend\`
   - En **Laragon**: `C:\laragon\www\paeat-backend\`

2. Verifica la configuración en `C:\xampp\htdocs\paeat-backend\config\db.php`:
   ```php
   $host = '127.0.0.1';
   $db   = 'paeat_db';
   $user = 'root';
   $pass = ''; // Contraseña por defecto en XAMPP es vacía
   ```

---

## 🧪 Paso 4: Probar los Endpoints en Navegador o Postman

### 1. Iniciar Sesión (Login)
- **URL**: `http://localhost/paeat-backend/api/login.php`
- **Método**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "role": "admin",
    "documento": "1140065530",
    "password": "Thomas27"
  }
  ```

### 2. Consultar Estudiantes por Grado
- **URL**: `http://localhost/paeat-backend/api/estudiantes.php?grado=6`
- **Método**: `GET`

### 3. Marcar Refrigerio como Recibido
- **URL**: `http://localhost/paeat-backend/api/estudiantes.php`
- **Método**: `POST`
- **Body**:
  ```json
  {
    "action": "update_status",
    "id": "st-1",
    "status": "Recibido",
    "repartidor_id": "rep-1"
  }
  ```

### 4. Enviar un PQR
- **URL**: `http://localhost/paeat-backend/api/pqrs.php`
- **Método**: `POST`
- **Body**:
  ```json
  {
    "senderEmail": "acudiente@ejemplo.com",
    "message": "Consulta sobre las raciones alimenticias."
  }
  ```

---

## 🔒 Credenciales de Prueba Incluidas en la Semilla

### Administradores:
1. **Thomas Marin**: Doc `1140065530` | Pass `Thomas27`
2. **Joel Mendoza**: Doc `1140066076` | Pass `Joel29`

### Repartidores:
1. **Estefania Quintero**: Doc `1140065531` | Pass `1140065530`
2. **Xiomara Cardona**: Doc `1140066071` | Pass `1140066076`
