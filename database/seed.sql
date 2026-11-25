-- ============================================================================
-- AETHER LAB // DATOS SEMILLA (SEED DATA)
-- Usuarios de prueba, Instrumental de laboratorio y Préstamos iniciales
-- ============================================================================

-- 1. USUARIOS DEL SISTEMA
-- Contraseñas hasheadas con bcrypt (cost factor 10):
-- admin@aetherlab.io       -> Admin123!
-- encargado@aetherlab.io   -> Encargado123!
-- operador@aetherlab.io    -> Operador123!
-- investigador@aetherlab.io -> Usuario123!

INSERT INTO usuarios (id, nombre, email, password_hash, rol, cargo, departamento, activo) VALUES
(1, 'Dra. Elena Vasquez', 'admin@aetherlab.io', '$2a$10$IHsadEENmdpptod8Y5aUr.zWe38fQ/aKUoNJ3XEwhASw1/NHNROcK', 'ADMIN', 'Directora de Laboratorio / SuperAdmin', 'Dirección I+D', 1),
(2, 'Ing. Marco Altamirano', 'encargado@aetherlab.io', '$2a$10$I3Ciz23mrlMQMJvN8p7r.uCpBzTSNZo9AhYfTnNSMXRKuUFv5HC9a', 'ENCARGADO', 'Jefe de Taller & Calibración', 'Ingeniería de Hardware', 1),
(3, 'Téc. Carlos Mendoza', 'operador@aetherlab.io', '$2a$10$LzDL4.Rd.vdG.auPPG56suUYXLpzXb8EbolL31RJBP1U9j9mf6hdW', 'OPERADOR', 'Operador de Pruebas Electrónicas', 'Sistemas Embebidos', 1),
(4, 'Ing. Sofia Ramirez', 'investigador@aetherlab.io', '$2a$10$UNOVNsXFXJd9raS6bsfKde7/sC7BAwbnif56VIAmQYY69tefHZSxC', 'USUARIO', 'Investigadora en Robótica y Drones', 'División Robótica Avanzada', 1);

-- 2. CATÁLOGO DE INSTRUMENTAL Y HERRAMIENTAS DE ALTA PRECISIÓN
INSERT INTO equipos (id, codigo, nombre, categoria, marca, modelo, numero_serie, ubicacion, estado, descripcion, especificaciones) VALUES
(1, 'EQ-OSC-01', 'Osciloscopio Digital de Fósforo 4CH 200MHz', 'Osciloscopios', 'Tektronix', 'DPO2024B', 'TKX-882910-B', 'Lab Alfa // Bahía 01 - Banco A', 'DISPONIBLE', 'Osciloscopio para análisis de señales mixtas, decodificación de buses I2C, SPI y UART.', '4 Canales, 200 MHz, 1 GS/s por canal, Pantalla 7" TFT'),
(2, 'EQ-PWR-01', 'Fuente de Alimentación Programable Triple DC', 'Fuentes de Poder', 'Rigol', 'DP832', 'RIG-994012-P', 'Lab Alfa // Bahía 02 - Banco B', 'PRESTADO', 'Fuente lineal regulada de bajo rizado para prototipado con microcontroladores.', '3 Canales (30V/3A, 30V/3A, 5V/3A), 195W total, Resolución 1mV/1mA'),
(3, 'EQ-GEN-01', 'Generador de Formas de Onda Arbitrarias', 'Generadores', 'Siglent', 'SDG1032X', 'SIG-551022-X', 'Lab Alfa // Bahía 01 - Banco C', 'DISPONIBLE', 'Generador de funciones y señales arbitrarias de doble canal con tecnología TrueArb.', '30 MHz de ancho de banda, 150 MSa/s, resolución vertical 14 bits'),
(4, 'EQ-SLD-01', 'Estación de Soldadura de Precisión Hakko', 'Soldadura', 'Hakko', 'FX-951', 'HAK-772911-S', 'Taller Prototipado // Mesa 03', 'DISPONIBLE', 'Estación termocontrolada digital para soldadura SMD y microelectrónica de paso fino.', 'Control de temperatura 200°C a 450°C, puntas serie T15, bloqueo con tarjeta'),
(5, 'EQ-DMM-01', 'Multímetro Digital de Banco 6.5 Dígitos', 'Medición', 'Fluke', '8846A', 'FLK-449102-D', 'Lab Alfa // Bahía 03 - Banco A', 'PRESTADO', 'Multímetro de calibración y laboratorio de alta exactitud con capacidad gráfica.', '6.5 Dígitos, 0.0024% precisión DC básica, interfaz LAN/GPIB, medición de temperatura'),
(6, 'EQ-LOG-01', 'Analizador Lógico USB 16 Canales', 'Analizadores', 'Saleae', 'Logic Pro 16', 'SAL-339100-L', 'Gabinete Blindado // Cajón 02', 'DISPONIBLE', 'Analizador lógico y osciloscopio analógico USB para captura de protocolos digitales.', '16 canales digitales/analógicos, 500 MS/s digital, USB 3.0 super-speed'),
(7, 'EQ-AIR-01', 'Estación de Desoldadura por Aire Caliente', 'Soldadura', 'Quick', '861DW', 'QCK-662910-W', 'Taller Prototipado // Mesa 04', 'EN_MANTENIMIENTO', 'Sistema de aire caliente para retrabajo de BGA y componentes de montaje superficial.', '1000W de potencia, flujo hasta 120 L/min, perfiles CH1/CH2/CH3 programables'),
(8, 'EQ-THM-01', 'Cámara Termográfica Infrarroja Industrial', 'Óptica y Térmica', 'FLIR', 'E8-XT', 'FLR-110293-T', 'Gabinete Óptico // Estante 01', 'DISPONIBLE', 'Cámara térmica para detección de puntos calientes en placas PCB y motores brushless.', 'Resolución térmica 320x240 (76,800 píxeles), rango -20°C a 550°C, tecnología MSX'),
(9, 'EQ-LCR-01', 'Medidor LCR de Precisión para Componentes', 'Medición', 'Keysight', 'E4980AL', 'KEY-902194-M', 'Lab Alfa // Bahía 04 - Banco A', 'DISPONIBLE', 'Medidor de inductancia, capacitancia y resistencia con barrido de frecuencias.', 'Frecuencia de prueba 20 Hz a 1 MHz, precisión básica 0.05%, pantalla gráfica'),
(10, 'EQ-3DP-01', 'Impresora 3D de Resina de Grado Ingeniería', 'Fabricación Digital', 'Formlabs', 'Form 3+', 'FRM-771029-P', 'Sala Fabricación // Cabina B', 'DANADO', 'Impresora estereolitográfica SLA para encapsulados mecánicos de alta fidelidad.', 'Volumen 14.5 x 14.5 x 18.5 cm, tecnología LFS (Low Force Stereolithography), láser 250mW'),
(11, 'EQ-SPEC-01', 'Analizador de Espectro RF en Tiempo Real', 'RF & Microondas', 'Rigol', 'RSA3030N', 'RIG-229103-R', 'Lab RF // Banco Faraday 01', 'DISPONIBLE', 'Analizador de espectro para caracterización de emisiones de radiofrecuencia e interferencias.', '9 kHz a 3.0 GHz, ancho de banda de tiempo real 40 MHz, generador de seguimiento'),
(12, 'EQ-CAL-01', 'Calibrador de Procesos Documentador de Campo', 'Calibración', 'Fluke', '754', 'FLK-667721-C', 'Gabinete Blindado // Cajón 01', 'DISPONIBLE', 'Instrumento portátil para calibración de transmisores de presión, RTDs y lazos 4-20mA.', 'Mide y genera voltios, mA, RTD, termopares, soporte para protocolo HART');

-- 3. HISTORIAL DE ESTADOS INICIAL
INSERT INTO historial_estados (equipo_id, estado_anterior, estado_nuevo, motivo, usuario_id, fecha) VALUES
(2, 'DISPONIBLE', 'PRESTADO', 'Préstamo para pruebas de alimentación en placa controladora de dron', 2, datetime('now', '-3 days')),
(5, 'DISPONIBLE', 'PRESTADO', 'Préstamo para calibración de celda de carga de alta precisión', 1, datetime('now', '-1 days')),
(7, 'DISPONIBLE', 'EN_MANTENIMIENTO', 'Resistencia cerámica con desgaste. En espera de repuesto oficial', 2, datetime('now', '-5 days')),
(10, 'DISPONIBLE', 'DANADO', 'Sensor de nivel óptico de resina bloqueado y bandeja con perforación', 1, datetime('now', '-7 days'));

-- 4. REGISTROS DE PRÉSTAMOS
-- 2 Préstamos activos actuales y 2 préstamos históricos devueltos para estadísticas
INSERT INTO prestamos (
    id, codigo_prestamo, equipo_id, usuario_id, solicitante_nombre, solicitante_departamento,
    proposito, fecha_prestamo, fecha_limite, fecha_devolucion, estado_prestamo,
    condicion_entrega, condicion_devolucion, observaciones_prestamo, observaciones_devolucion,
    autorizado_por_id, recibido_por_id
) VALUES
(
    1, 'PR-2026-001', 2, 4, 'Ing. Sofia Ramirez', 'División Robótica Avanzada',
    'Alimentación de banco para pruebas continuas de ESCs y telemetría de dron hexacóptero.',
    datetime('now', '-3 days'), datetime('now', '+2 days'), NULL, 'ACTIVO',
    'OPERATIVO', NULL, 'Cables de salida y conector banana a caimán incluidos.', NULL,
    2, NULL
),
(
    2, 'PR-2026-002', 5, 3, 'Téc. Carlos Mendoza', 'Sistemas Embebidos',
    'Verificación de caída de tensión y ruido térmico en puente de Wheatstone.',
    datetime('now', '-1 days'), datetime('now', '+4 days'), NULL, 'ACTIVO',
    'OPERATIVO', NULL, 'Puntas de prueba chapadas en oro y fusible verificado.', NULL,
    1, NULL
),
(
    3, 'PR-2026-003', 1, 4, 'Ing. Sofia Ramirez', 'División Robótica Avanzada',
    'Depuración de protocolo CAN-Bus y captura de trama de fallo intermitente.',
    datetime('now', '-10 days'), datetime('now', '-6 days'), datetime('now', '-6 days', '+3 hours'), 'DEVUELTO',
    'OPERATIVO', 'OPERATIVO', 'Se entregó con 4 sondas atenuadas 10X.', 'Retornado en perfecto estado con estuche y accesorios completos.',
    2, 2
),
(
    4, 'PR-2026-004', 3, 3, 'Téc. Carlos Mendoza', 'Sistemas Embebidos',
    'Inyección de señal senoidal de 10kHz en filtro activo pasa-banda.',
    datetime('now', '-14 days'), datetime('now', '-11 days'), datetime('now', '-11 days', '+1 hours'), 'DEVUELTO',
    'OPERATIVO', 'OPERATIVO', 'Cable BNC a BNC incluido.', 'Equipo revisado y funcional.',
    1, 1
);
