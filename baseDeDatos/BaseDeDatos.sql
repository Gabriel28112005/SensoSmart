-- ============================================================
-- SensoSmart — Base de Datos (versión definitiva)
-- UAX · SENER 2026 — Grupo 15
-- Motor: MySQL 8.0+
-- ============================================================
-- CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR:
--   · Campo `plan` (smart/elite) en usuarios
--   · Tabla `contratos` (gestión de facturación e impagos)
--   · Tabla `predicciones` (recomendaciones de IA)
--   · Tabla `mapa_calor` (Elite — uniformidad cromática en tiempo real)
--   · Tabla `riesgo_lesiones` (Elite — predicción de lesiones)
--   · Tabla `chat_asistente` (Elite — historial del asistente conversacional)
--   · Sensores con modelo, proveedor, alimentación y calibración
--   · Lecturas con pH (los sensores nuevos lo miden)
--   · Lecturas_ambiente con PAR (Elite ATMOS 41)
--   · Informes con campos de IA (uniformidad_score, malas_hierbas_detectadas)
-- ============================================================

CREATE DATABASE IF NOT EXISTS SensoSmartDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE SensoSmartDB;

-- ============================================================
-- USUARIOS — ahora con campo plan (smart/elite)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('greenkeeper','director','auditor','admin') NOT NULL DEFAULT 'greenkeeper',
  plan          ENUM('smart','elite') NOT NULL DEFAULT 'smart',
  club          VARCHAR(100),
  estadio       VARCHAR(100),
  email         VARCHAR(150),
  telefono      VARCHAR(20),
  activo        BOOLEAN   DEFAULT TRUE,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL
);

-- ============================================================
-- CONTRATOS — gestión de facturación, SLA y suspensión por impago
-- ============================================================
CREATE TABLE IF NOT EXISTS contratos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  club               VARCHAR(100) NOT NULL,
  estadio            VARCHAR(100),
  plan               ENUM('smart','elite') NOT NULL,
  cuota_inicial      DECIMAL(10,2),
  cuota_mensual      DECIMAL(8,2),
  fecha_inicio       DATE,
  fecha_renovacion   DATE,
  permanencia_meses  INT DEFAULT 24,
  sla_disponibilidad DECIMAL(5,2) DEFAULT 99.00,
  ultimo_pago        DATE,
  dias_impago        INT DEFAULT 0,
  suspendido         BOOLEAN DEFAULT FALSE,
  activo             BOOLEAN DEFAULT TRUE,
  creado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SENSORES — con modelo, proveedor, alimentación y calibración
-- ============================================================
CREATE TABLE IF NOT EXISTS sensores (
  id                  VARCHAR(10) PRIMARY KEY,
  zona                VARCHAR(100) NOT NULL,
  capa                ENUM('tierra','superficie','aire') NOT NULL,
  estadio             VARCHAR(100),
  x_campo             FLOAT,
  y_campo             FLOAT,
  bateria             INT  DEFAULT 100,
  estado              ENUM('ok','alerta','critico') DEFAULT 'ok',
  modelo              VARCHAR(50),
  proveedor           VARCHAR(50),
  tipo_alimentacion   ENUM('bateria','solar','cableada') DEFAULT 'bateria',
  ultima_calibracion  DATE,
  activo              BOOLEAN DEFAULT TRUE,
  instalado_en        DATE
);

-- ============================================================
-- LECTURAS DE SENSORES (con pH añadido — los nuevos sensores lo miden)
-- ============================================================
CREATE TABLE IF NOT EXISTS lecturas (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  sensor_id   VARCHAR(10) NOT NULL,
  timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  humedad     FLOAT,
  temperatura FLOAT,
  salinidad   FLOAT,
  ph          FLOAT,
  INDEX idx_sensor_time (sensor_id, timestamp),
  FOREIGN KEY (sensor_id) REFERENCES sensores(id)
);

-- ============================================================
-- LECTURAS AMBIENTE (con PAR para clientes Elite)
-- ============================================================
CREATE TABLE IF NOT EXISTS lecturas_ambiente (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  estadio          VARCHAR(100),
  timestamp        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  temp_superficial FLOAT,
  temp_aire        FLOAT,
  humedad_relativa FLOAT,
  velocidad_viento FLOAT,
  horas_sol        FLOAT,
  radiacion_par    FLOAT,
  presion_atm      FLOAT,
  uv_index         FLOAT,
  et_estimada      FLOAT
);

-- ============================================================
-- ALERTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS alertas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sensor_id   VARCHAR(10),
  zona        VARCHAR(100),
  tipo        VARCHAR(50),
  severidad   ENUM('informativa','preventiva','critica') NOT NULL,
  titulo      VARCHAR(200),
  descripcion TEXT,
  resuelta    BOOLEAN   DEFAULT FALSE,
  creada_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resuelta_en TIMESTAMP NULL,
  FOREIGN KEY (sensor_id) REFERENCES sensores(id)
);

-- ============================================================
-- PREDICCIONES DE IA — recomendaciones generadas automáticamente
-- ============================================================
CREATE TABLE IF NOT EXISTS predicciones (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  estadio          VARCHAR(100),
  tipo             VARCHAR(50),
  zona             VARCHAR(100),
  valor_predicho   FLOAT,
  horizonte_horas  INT,
  confianza        FLOAT,
  modelo           VARCHAR(50),
  recomendacion    TEXT,
  ejecutada        BOOLEAN DEFAULT FALSE,
  generada_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MAPA DE CALOR (solo Elite) — uniformidad cromática en tiempo real
-- ============================================================
CREATE TABLE IF NOT EXISTS mapa_calor (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  estadio       VARCHAR(100),
  timestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  zona_x        FLOAT,
  zona_y        FLOAT,
  ndvi          FLOAT,
  temp_termica  FLOAT,
  uniformidad   FLOAT,
  estado_zona   ENUM('optimo','aceptable','atencion','critico') DEFAULT 'optimo'
);

-- ============================================================
-- RIESGO DE LESIONES (solo Elite)
-- ============================================================
CREATE TABLE IF NOT EXISTS riesgo_lesiones (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  estadio            VARCHAR(100),
  fecha              DATE,
  zona               VARCHAR(100),
  riesgo             ENUM('bajo','medio','alto','muy_alto') DEFAULT 'bajo',
  prob_lesion        FLOAT,
  factor_dureza      FLOAT,
  factor_humedad     FLOAT,
  factor_uniformidad FLOAT,
  recomendacion      TEXT,
  generado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CHAT ASISTENTE (solo Elite)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_asistente (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  estadio     VARCHAR(100),
  usuario     VARCHAR(50),
  pregunta    TEXT,
  respuesta   TEXT,
  modelo      VARCHAR(50),
  timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EVENTOS DEL CAMPO
-- ============================================================
CREATE TABLE IF NOT EXISTS eventos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  estadio     VARCHAR(100),
  tipo        VARCHAR(100),
  descripcion VARCHAR(200),
  fecha       DATE NOT NULL,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MANTENIMIENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS mantenimiento (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  estadio          VARCHAR(100),
  tarea            VARCHAR(200),
  prioridad        ENUM('normal','alta','critica') DEFAULT 'normal',
  fecha_programada DATE,
  completada       BOOLEAN   DEFAULT FALSE,
  creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INFORMES PRE-PARTIDO (con detección IA de malas hierbas)
-- ============================================================
CREATE TABLE IF NOT EXISTS informes (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  estadio                  VARCHAR(100),
  jornada                  VARCHAR(20),
  fecha                    DATE,
  altura_cesped            FLOAT,
  dureza                   FLOAT,
  traccion                 FLOAT,
  uniformidad_ok           BOOLEAN,
  uniformidad_score        FLOAT,
  malas_hierbas_detectadas TEXT,
  hongos_detectados        TEXT,
  estado                   ENUM('apto','condicionado','no_apto') DEFAULT 'apto',
  generado_en              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SESIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS sesiones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario       INT          NOT NULL,
  nombreUsuario   VARCHAR(50)  NOT NULL,
  tipoDispositivo VARCHAR(200) NULL,
  direccionIP     VARCHAR(50)  NULL,
  inicio          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fin             TIMESTAMP NULL,
  activa          BOOLEAN   DEFAULT TRUE,
  FOREIGN KEY (idUsuario) REFERENCES usuarios(id)
);

-- ============================================================
-- DATOS DEMO
-- Contraseña de todos los usuarios: 1234
-- Real Madrid, Barça y Atlético → ELITE
-- CD Logroñés (Tercera Federación) → SMART
-- ============================================================

INSERT IGNORE INTO usuarios
  (usuario, password_hash, rol, plan, club, estadio, email)
VALUES
  ('greenkeeper', '$2a$10$WuauocGkCDJnHHWF7WnmoeggCsAgomUmXwwhq22b5SnGh6NJmD/Yy', 'greenkeeper', 'elite', 'Real Madrid CF',      'Santiago Bernabéu',     'greenkeeper@realmadrid.com'),
  ('director',    '$2a$10$WuauocGkCDJnHHWF7WnmoeggCsAgomUmXwwhq22b5SnGh6NJmD/Yy', 'director',    'elite', 'Real Madrid CF',      'Santiago Bernabéu',     'director@realmadrid.com'),
  ('auditor',     '$2a$10$WuauocGkCDJnHHWF7WnmoeggCsAgomUmXwwhq22b5SnGh6NJmD/Yy', 'auditor',     'elite', 'LaLiga',              'General',               'inspector@laliga.es'),
  ('admin',       '$2a$10$WuauocGkCDJnHHWF7WnmoeggCsAgomUmXwwhq22b5SnGh6NJmD/Yy', 'admin',       'elite', 'SensoSmart',       'General',               'admin@smartturfai.com'),
  ('barcelona',   '$2a$10$WuauocGkCDJnHHWF7WnmoeggCsAgomUmXwwhq22b5SnGh6NJmD/Yy', 'greenkeeper', 'elite', 'FC Barcelona',        'Spotify Camp Nou',      'greenkeeper@fcbarcelona.cat'),
  ('atletico',    '$2a$10$WuauocGkCDJnHHWF7WnmoeggCsAgomUmXwwhq22b5SnGh6NJmD/Yy', 'greenkeeper', 'elite', 'Atlético de Madrid',  'Cívitas Metropolitano', 'greenkeeper@atleticodemadrid.com'),
  ('cd_logrones', '$2a$10$WuauocGkCDJnHHWF7WnmoeggCsAgomUmXwwhq22b5SnGh6NJmD/Yy', 'greenkeeper', 'smart', 'CD Logroñés',         'Las Gaunas',            'greenkeeper@cdlogrones.es');

INSERT IGNORE INTO contratos
  (club, estadio, plan, cuota_inicial, cuota_mensual, fecha_inicio, fecha_renovacion, permanencia_meses, sla_disponibilidad, ultimo_pago, activo)
VALUES
  ('Real Madrid CF',     'Santiago Bernabéu',     'elite', 40000.00, 3200.00, '2026-01-01', '2029-01-01', 36, 99.90, '2026-04-30', TRUE),
  ('FC Barcelona',       'Spotify Camp Nou',      'elite', 40000.00, 3200.00, '2026-02-15', '2029-02-15', 36, 99.90, '2026-04-30', TRUE),
  ('Atlético de Madrid', 'Cívitas Metropolitano', 'elite', 40000.00, 3200.00, '2026-03-01', '2029-03-01', 36, 99.90, '2026-04-30', TRUE),
  ('CD Logroñés',        'Las Gaunas',            'smart',  6600.00,  550.00, '2026-03-15', '2028-03-15', 24, 99.00, '2026-04-30', TRUE);

INSERT IGNORE INTO sensores (id, zona, capa, estadio, x_campo, y_campo, bateria, estado, modelo, proveedor, tipo_alimentacion) VALUES
  ('S01', 'Portería Norte',  'tierra', 'Santiago Bernabéu',  80,  80, 92, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S02', 'Lateral Izq.',    'tierra', 'Santiago Bernabéu', 180,  60, 88, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S03', 'Centro Norte',    'tierra', 'Santiago Bernabéu', 300,  50, 85, 'alerta',  'DL-PR26', 'Decentlab', 'bateria'),
  ('S04', 'Lateral Der.',    'tierra', 'Santiago Bernabéu', 420,  60, 91, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S05', 'Portería Sur',    'tierra', 'Santiago Bernabéu', 520,  80, 87, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S06', 'Centro Izq.',     'tierra', 'Santiago Bernabéu', 140, 150, 90, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S07', 'Centro Campo',    'tierra', 'Santiago Bernabéu', 300, 150, 31, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S08', 'Centro Der.',     'tierra', 'Santiago Bernabéu', 460, 150, 89, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S09', 'Área Norte',      'tierra', 'Santiago Bernabéu',  80, 220, 84, 'critico', 'DL-PR26', 'Decentlab', 'bateria'),
  ('S10', 'Lateral Izq. S',  'tierra', 'Santiago Bernabéu', 180, 240, 93, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S11', 'Centro Sur',      'tierra', 'Santiago Bernabéu', 300, 250, 86, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('S12', 'Lateral Der. S',  'tierra', 'Santiago Bernabéu', 420, 240, 88, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('B01', 'Portería Norte',  'tierra', 'Spotify Camp Nou',   80,  80, 90, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('B02', 'Lateral Izq.',    'tierra', 'Spotify Camp Nou',  180,  60, 87, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('B03', 'Centro Norte',    'tierra', 'Spotify Camp Nou',  300,  50, 91, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('B04', 'Lateral Der.',    'tierra', 'Spotify Camp Nou',  420,  60, 88, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('B05', 'Portería Sur',    'tierra', 'Spotify Camp Nou',  520,  80, 85, 'alerta',  'DL-PR26', 'Decentlab', 'bateria'),
  ('B06', 'Centro Campo',    'tierra', 'Spotify Camp Nou',  300, 150, 92, 'ok',      'DL-PR26', 'Decentlab', 'bateria'),
  ('A01', 'Portería Norte',  'tierra', 'Cívitas Metropolitano',  80,  80, 89, 'ok',     'DL-PR26', 'Decentlab', 'bateria'),
  ('A02', 'Lateral Izq.',    'tierra', 'Cívitas Metropolitano', 180,  60, 91, 'ok',     'DL-PR26', 'Decentlab', 'bateria'),
  ('A03', 'Centro Norte',    'tierra', 'Cívitas Metropolitano', 300,  50, 78, 'alerta', 'DL-PR26', 'Decentlab', 'bateria'),
  ('A04', 'Lateral Der.',    'tierra', 'Cívitas Metropolitano', 420,  60, 93, 'ok',     'DL-PR26', 'Decentlab', 'bateria'),
  ('A05', 'Portería Sur',    'tierra', 'Cívitas Metropolitano', 520,  80, 86, 'ok',     'DL-PR26', 'Decentlab', 'bateria'),
  ('A06', 'Centro Campo',    'tierra', 'Cívitas Metropolitano', 300, 150, 90, 'ok',     'DL-PR26', 'Decentlab', 'bateria'),
  ('L01', 'Portería Norte',  'tierra', 'Las Gaunas',  80,  80, 95, 'ok',     'EM500-SMC-PH', 'Milesight', 'bateria'),
  ('L02', 'Centro Norte',    'tierra', 'Las Gaunas', 300,  50, 88, 'ok',     'EM500-SMC-PH', 'Milesight', 'bateria'),
  ('L03', 'Centro Campo',    'tierra', 'Las Gaunas', 300, 150, 91, 'ok',     'EM500-SMC-PH', 'Milesight', 'bateria'),
  ('L04', 'Centro Sur',      'tierra', 'Las Gaunas', 300, 250, 89, 'ok',     'EM500-SMC-PH', 'Milesight', 'bateria'),
  ('L05', 'Portería Sur',    'tierra', 'Las Gaunas', 520,  80, 84, 'alerta', 'EM500-SMC-PH', 'Milesight', 'bateria');
