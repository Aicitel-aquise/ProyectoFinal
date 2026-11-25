/**
 * Generador de Informe Técnico y Manual de Prácticas en formato Word (.docx)
 * Proyecto: AETHER LAB // Control de Préstamos de Equipos y Herramientas
 * Autor: Leticia Aquise Taco
 */

const fs = require('node:fs');
const path = require('node:path');
const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType
} = require('docx');

const COLOR_PRIMARY = '00838F';    // Cian técnico oscuro
const COLOR_DARK = '0A192F';       // Azul profundo
const COLOR_MUTED = '475569';      // Gris azulado
const COLOR_BG_HEADER = '0F2744';  // Fondo encabezados tabla
const COLOR_BG_ALT = 'F1F5F9';     // Fondo filas alternas tabla
const COLOR_EMERALD = '059669';    // Verde éxito
const COLOR_AMBER = 'D97706';      // Ámbar advertencia
const COLOR_CORAL = 'DC2626';      // Rojo peligro

function createTitle(text) {
    return new Paragraph({
        text: text,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 120 }
    });
}

function createH1(text) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 28,
                color: COLOR_DARK,
                font: 'Arial'
            })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 140 }
    });
}

function createH2(text) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 24,
                color: COLOR_PRIMARY,
                font: 'Arial'
            })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 100 }
    });
}

function createH3(text) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 20,
                color: COLOR_DARK,
                font: 'Arial'
            })
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 }
    });
}

function createP(text, options = {}) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                size: 20,
                font: 'Calibri',
                color: options.color || '1E293B',
                bold: options.bold || false,
                italics: options.italics || false
            })
        ],
        alignment: options.align || AlignmentType.LEFT,
        spacing: { before: 60, after: 60 }
    });
}

function createCallout(title, text, type = 'info') {
    const borderColor = type === 'alert' ? COLOR_CORAL : (type === 'success' ? COLOR_EMERALD : COLOR_PRIMARY);
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `📌 ${title}: `, bold: true, color: borderColor, size: 20, font: 'Arial' }),
                                    new TextRun({ text: text, size: 20, font: 'Calibri' })
                                ],
                                spacing: { before: 60, after: 60 }
                            })
                        ],
                        shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                        borders: {
                            left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                            top: { style: BorderStyle.NONE },
                            right: { style: BorderStyle.NONE },
                            bottom: { style: BorderStyle.NONE }
                        },
                        margins: { top: 120, bottom: 120, left: 160, right: 160 }
                    })
                ]
            })
        ]
    });
}

function createTable(headers, rowsData) {
    const tableRows = [];

    // Fila Encabezado
    tableRows.push(
        new TableRow({
            tableHeader: true,
            children: headers.map(h => new TableCell({
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18, font: 'Arial' })],
                        alignment: AlignmentType.CENTER
                    })
                ],
                shading: { fill: COLOR_BG_HEADER, type: ShadingType.CLEAR },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
            }))
        })
    );

    // Filas Datos
    rowsData.forEach((row, idx) => {
        const bg = (idx % 2 === 1) ? COLOR_BG_ALT : 'FFFFFF';
        tableRows.push(
            new TableRow({
                children: row.map(cellText => new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: cellText, size: 18, font: 'Calibri' })],
                            spacing: { before: 40, after: 40 }
                        })
                    ],
                    shading: { fill: bg, type: ShadingType.CLEAR },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 }
                }))
            })
        );
    });

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
    });
}

async function buildDocx() {
    const doc = new Document({
        creator: 'Leticia Aquise Taco',
        title: 'Informe Técnico y Manual de Prácticas AETHER LAB',
        description: 'Documentación de Ingeniería de Software para Examen Final INS600',
        sections: [
            {
                properties: {},
                children: [
                    // PORTADA Y ENCABEZADO
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'UNIVERSIDAD / CARRERA DE INGENIERÍA DE SISTEMAS', bold: true, size: 24, color: COLOR_DARK, font: 'Arial' })
                        ],
                        alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'ASIGNATURA: INS600 — EXAMEN PRÁCTICO FINAL', size: 20, color: COLOR_MUTED, font: 'Arial' })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'INFORME TÉCNICO Y MANUAL DE PRÁCTICAS DE LABORATORIO',
                                bold: true,
                                size: 32,
                                color: COLOR_PRIMARY,
                                font: 'Arial'
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 140 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'SISTEMA: "AETHER LAB // CONTROL DE PRÉSTAMOS DE EQUIPOS Y HERRAMIENTAS"',
                                bold: true,
                                size: 22,
                                color: COLOR_DARK,
                                font: 'Arial'
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),

                    createTable(
                        ['DATO DEL PROYECTO', 'INFORMACIÓN OFICIAL'],
                        [
                            ['Autora / Postulante:', 'Leticia Aquise Taco'],
                            ['Materia / Módulo:', 'INS600 — Taller de Ingeniería de Software'],
                            ['Arquitectura:', '3 Capas (Presentación / Lógica API REST / Acceso a Datos SQL)'],
                            ['Seguridad y Criptografía:', 'Bcrypt (Salt 10) + JWT (JSON Web Tokens) con RBAC'],
                            ['Base de Datos Principal:', 'Microsoft SQL Server 2022 (Instancia: LETICIA\\SQLEXPRESS)'],
                            ['Base de Datos Respaldo:', 'SQLite Relacional Nativo de Node.js 22 (DatabaseSync)'],
                            ['Servidor Web / Backend:', 'Node.js v22.16 + Express 4.x (Puerto: 3000)'],
                            ['Interfaz de Usuario:', 'Modo Oscuro Cinematográfico HUD (#070B14, Cyan #00E5FF)']
                        ]
                    ),

                    new Paragraph({ text: '', spacing: { after: 200 } }),

                    // SECCIÓN 1: RESUMEN Y OBJETIVOS
                    createH1('1. RESUMEN EJECUTIVO Y OBJETIVOS DEL SISTEMA'),
                    createP('El sistema AETHER LAB ha sido concebido para resolver el problema crítico del extravío de instrumental de alto costo, el descontrol en los plazos de retorno y el riesgo operativo de prestar herramientas averiadas o descalibradas en laboratorios de electrónica, talleres de prototipado y centros de I+D.'),
                    createCallout('OBJETIVO GENERAL', 'Desarrollar una plataforma web full-stack táctica y transaccional que automatice el inventario, autorice préstamos bajo validación estricta de disponibilidad y clasifique la condición física de retorno de cada herramienta para garantizar la operatividad de los bancos de trabajo.', 'info'),

                    // SECCIÓN 2: ARQUITECTURA EN 3 CAPAS
                    createH1('2. ARQUITECTURA DE SOFTWARE EN 3 CAPAS'),
                    createP('El sistema implementa una estricta separación de responsabilidades que garantiza mantenibilidad, seguridad y escalabilidad:'),
                    createTable(
                        ['CAPA', 'TECNOLOGÍAS', 'RESPONSABILIDADES TÉCNICAS'],
                        [
                            [
                                'Capa 1:\nPresentación (Frontend)',
                                'HTML5 Semántico, CSS3 Variables, Glassmorphism, Vanilla JS Moderno, Web Audio API.',
                                'Interfaz de centro de control táctico HUD. Renderiza Dashboard con KPIs en tiempo real, catálogo interactivo, formularios modales, audio procedural para eventos y alertas flotantes (Toast).'
                            ],
                            [
                                'Capa 2:\nLógica de Negocio (Backend)',
                                'Node.js v22, Express 4.x, bcryptjs, jsonwebtoken, CORS.',
                                'Enrutamiento REST, middleware de control de acceso por roles (RBAC), encriptación de claves, reglas de validación de préstamos, transacciones atómicas e inspección métrica COCOMO II.'
                            ],
                            [
                                'Capa 3:\nAcceso a Datos (SQL Relacional)',
                                'Microsoft SQL Server (LETICIA\\SQLEXPRESS), SQLite nativo Node 22, ANSI SQL.',
                                'Persistencia relacional normalizada en tablas (usuarios, equipos, prestamos, historial_estados), integridad referencial (FK), llaves primarias autoincrementales y disparadores de auditoría.'
                            ]
                        ]
                    ),

                    new Paragraph({ text: '', spacing: { after: 150 } }),

                    // SECCIÓN 3: DESCRIPCIÓN DETALLADA DE CADA CAMPO POR MÓDULO
                    createH1('3. DESCRIPCIÓN DETALLADA DE CADA CAMPO DEL SISTEMA'),
                    createP('A continuación se describe exhaustivamente cada campo, su tipo de dato, regla de validación y comportamiento de negocio en cada formulario del sistema:'),

                    createH2('3.1. Módulo de Autenticación y Registro (Terminal de Acceso)'),
                    createTable(
                        ['CAMPO EN PANTALLA', 'TIPO / DATO', 'VALIDACIÓN / REGLA DE NEGOCIO', 'DESCRIPCIÓN OPERATIVA'],
                        [
                            ['Correo Electrónico (Login)', 'Email (Varchar 150)', 'Obligatorio, formato email válido, debe existir en BD.', 'Identificador único del operador en el sistema institucional.'],
                            ['Contraseña (Login)', 'Password (Hash Bcrypt)', 'Obligatorio. Se compara contra el hash de costo 10 con bcrypt.compareSync.', 'Clave de seguridad cifrada. Si coincide, genera token JWT por 24h.'],
                            ['Nombre Completo (Registro)', 'Texto (Varchar 120)', 'Obligatorio. Mínimo 3 caracteres.', 'Nombre y título profesional del operador (ej. Dra. Elena Vasquez).'],
                            ['Rol Deseado (Registro)', 'Select (Enum)', 'Restringido por CHECK a ADMIN, ENCARGADO, OPERADOR, USUARIO.', 'Define los privilegios en la aplicación y qué botones se activan.'],
                            ['División / Departamento', 'Texto (Varchar 120)', 'Opcional (por defecto: División I+D & Prototipado).', 'Área de investigación donde el usuario desempeña funciones.']
                        ]
                    ),

                    new Paragraph({ text: '', spacing: { after: 120 } }),

                    createH2('3.2. Módulo de Catálogo e Inventario de Instrumental'),
                    createTable(
                        ['CAMPO EN FORMULARIO', 'TIPO / DATO', 'VALIDACIÓN / REGLA DE NEGOCIO', 'DESCRIPCIÓN OPERATIVA'],
                        [
                            ['Código Único (TAG)', 'Texto (Varchar 50)', 'Obligatorio, UNIQUE en base de datos. No se puede repetir.', 'Identificador técnico en placa (ej. EQ-OSC-01, EQ-PWR-01).'],
                            ['Nombre del Instrumento', 'Texto (Varchar 160)', 'Obligatorio. Nombre formal del equipo.', 'Denominación completa (ej. Osciloscopio Digital de Fósforo 4CH).'],
                            ['Categoría', 'Select (Varchar 60)', 'Obligatorio. Osciloscopios, Fuentes, Soldadura, Medición, etc.', 'Permite la clasificación y filtrado dinámico en catálogo.'],
                            ['Marca y Modelo', 'Texto (Varchar 80)', 'Opcional pero recomendado para calibración.', 'Fabricante y modelo comercial (ej. Tektronix / DPO2024B).'],
                            ['Número de Serie', 'Texto (Varchar 100)', 'Alfanumérico. Útil para auditoría de inventario.', 'Serial de fábrica estampado en el chasis del instrumento.'],
                            ['Ubicación en Laboratorio', 'Texto (Varchar 120)', 'Por defecto: Lab Alfa // Bahía 01 - Banco A.', 'Bahía física, estante o mesa donde reside el instrumento.'],
                            ['Estado del Equipo', 'Enum (Varchar 30)', 'DISPONIBLE, PRESTADO, EN_MANTENIMIENTO, DANADO, DE_BAJA.', 'Determina si el equipo puede o no ser prestado según regla de negocio.']
                        ]
                    ),

                    new Paragraph({ text: '', spacing: { after: 120 } }),

                    createH2('3.3. Módulo de Préstamos (Asignación de Instrumental)'),
                    createTable(
                        ['CAMPO EN FORMULARIO', 'TIPO / DATO', 'VALIDACIÓN / REGLA DE NEGOCIO', 'DESCRIPCIÓN OPERATIVA'],
                        [
                            ['Instrumento a Prestar', 'Select (FK equipo_id)', 'OBLIGATORIO. REGLA ESTRICTA: El equipo DEBE estar en DISPONIBLE.', 'Si el equipo está PRESTADO, EN_MANTENIMIENTO o DANADO, se rechaza la operación.'],
                            ['Solicitante / Responsable', 'Texto (Varchar 120)', 'Obligatorio. Se autocompleta con el usuario en sesión.', 'Persona legalmente responsable del cuidado del instrumental.'],
                            ['Departamento', 'Texto (Varchar 120)', 'Heredado del perfil del solicitante.', 'Unidad operativa que asume el uso del equipo.'],
                            ['Plazo Límite de Retorno', 'Datetime-local', 'Obligatorio. Debe ser una fecha y hora posterior a la actual.', 'Fecha máxima de retorno. Si se supera, se marca automáticamente VENCIDO.'],
                            ['Propósito Técnico', 'Textarea', 'Obligatorio. Justificación técnica de la solicitud.', 'Detalle del proyecto o prueba (ej. Captura de buses I2C en PCB).'],
                            ['Accesorios Incluidos', 'Texto libre', 'Opcional.', 'Anotaciones de entrega: puntas de prueba, sondas 10X, cables caimán.']
                        ]
                    ),

                    new Paragraph({ text: '', spacing: { after: 120 } }),

                    createH2('3.4. Módulo de Devoluciones (Inspección Técnica de Retorno)'),
                    createTable(
                        ['CAMPO EN FORMULARIO', 'TIPO / DATO', 'VALIDACIÓN / REGLA DE RETORNO', 'EFECTO EN EL EQUIPO'],
                        [
                            ['Condición: OPERATIVO', 'Radio Option', 'El equipo fue probado y funciona al 100%.', 'El equipo pasa de inmediato a estado DISPONIBLE para otros operadores.'],
                            ['Condición: CON OBSERVACIÓN', 'Radio Option', 'El equipo presenta desgaste, descalibración o falta de accesorios.', 'El equipo pasa a EN_MANTENIMIENTO y queda BLOQUEADO para nuevos préstamos.'],
                            ['Condición: DAÑADO / AVERIADO', 'Radio Option', 'El equipo sufrió daño físico, cortocircuito o rotura.', 'El equipo pasa a DAÑADO y queda BLOQUEADO hasta que el Administrador lo repare.'],
                            ['Observaciones de Recepción', 'Textarea', 'Detalle técnico de la inspección de recepción.', 'Se guarda en historial_estados para auditoría y peritaje.']
                        ]
                    ),

                    new Paragraph({ text: '', spacing: { after: 200 } }),

                    // SECCIÓN 4: BASE DE DATOS Y CONEXIÓN SQL SERVER
                    createH1('4. ESQUEMA DE BASE DE DATOS SQL SERVER (LETICIA\\SQLEXPRESS)'),
                    createP('El script único AETHER_LAB_SQLSERVER.sql ha sido estructurado y ejecutado directamente en la instancia de SQL Server del equipo. Las 4 tablas principales son:'),

                    createH2('4.1. Diccionario de Datos'),
                    createTable(
                        ['TABLA', 'LLAVE PRIMARIA', 'LLAVES FORÁNEAS', 'RESTRICCIONES CHECK'],
                        [
                            ['dbo.usuarios', 'id (INT IDENTITY)', 'Ninguna', 'rol IN (\'ADMIN\', \'ENCARGADO\', \'OPERADOR\', \'USUARIO\')'],
                            ['dbo.equipos', 'id (INT IDENTITY)', 'Ninguna', 'estado IN (\'DISPONIBLE\', \'PRESTADO\', \'EN_MANTENIMIENTO\', \'DANADO\', \'DE_BAJA\')'],
                            ['dbo.prestamos', 'id (INT IDENTITY)', 'equipo_id -> equipos(id)\nusuario_id -> usuarios(id)', 'estado_prestamo IN (\'ACTIVO\', \'DEVUELTO\', \'VENCIDO\')'],
                            ['dbo.historial_estados', 'id (INT IDENTITY)', 'equipo_id -> equipos(id)\nusuario_id -> usuarios(id)', 'ON DELETE CASCADE en equipo_id']
                        ]
                    ),

                    new Paragraph({ text: '', spacing: { after: 200 } }),

                    // SECCIÓN 5: MANUAL DE PRÁCTICAS PASO A PASO
                    createH1('5. MANUAL DE PRÁCTICAS PASO A PASO (GUÍA DE EVALUACIÓN)'),
                    createP('A continuación se detalla la secuencia de pruebas prácticas que deben ejecutarse ante el docente o tribunal para evidenciar el correcto funcionamiento de cada campo y regla de negocio:'),

                    createH2('PRÁCTICA 1: Autenticación con Bcrypt y Verificación de Roles (RBAC)'),
                    createP('1. Abrir el navegador web y acceder a http://localhost:3000.'),
                    createP('2. En la pantalla "00 // ACCESO OPERADOR", hacer clic en la tarjeta de demostración: ADMINISTRADOR (Dra. Elena Vasquez).'),
                    createP('3. Comprobar que en el encabezado superior aparece el nombre en cian y el badge púrpura [ADMIN].'),
                    createP('4. Comprobar que se activa el botón "+ NUEVO EQUIPO" y la pestaña "04 // OPERADORES & ROLES".'),
                    createP('5. Hacer clic en "CERRAR SESIÓN" y entrar con la tarjeta: INVESTIGADOR (Ing. Sofia Ramirez).'),
                    createP('6. Verificar que como Investigador las herramientas administrativas quedan ocultas y protegidas.'),
                    createCallout('RESULTADO ESPERADO DE PRÁCTICA 1', 'El sistema valida el hash de contraseña encriptada con bcrypt, emite el token JWT y aplica el control de acceso basado en roles (RBAC) de forma transparente y reactiva.', 'success'),

                    new Paragraph({ text: '', spacing: { after: 120 } }),

                    createH2('PRÁCTICA 2: Verificación de Regla de Negocio (Bloqueo de Equipo No Disponible)'),
                    createP('1. Iniciar sesión como Administrador o Encargado.'),
                    createP('2. Dirigirse a la pestaña "03 // PRÉSTAMOS & DEVOLUCIONES".'),
                    createP('3. Hacer clic en el botón cian: "REGISTRAR NUEVO PRÉSTAMO".'),
                    createP('4. En el campo "INSTRUMENTO / EQUIPO A PRESTAR", seleccionar un equipo no disponible (ejemplo: EQ-PWR-01 Fuente Triple DC, que se encuentra PRESTADO, o EQ-3DP-01 que está DAÑADO).'),
                    createP('5. Observar cómo la caja de vista previa se tiñe de rojo con el mensaje de advertencia: "ATENCIÓN: Este equipo no está DISPONIBLE".'),
                    createP('6. Intentar enviar el formulario. Observar cómo el Backend intercepta la petición y responde con código HTTP 400 y mensaje: "TRANSACCIÓN DENEGADA: El equipo ya se encuentra actualmente en calidad de PRESTADO/DAÑADO".'),
                    createCallout('RESULTADO ESPERADO DE PRÁCTICA 2', 'La regla de negocio número 1 se cumple de forma irrompible. Es imposible prestar herramientas que no se encuentren en estado DISPONIBLE.', 'alert'),

                    new Paragraph({ text: '', spacing: { after: 120 } }),

                    createH2('PRÁCTICA 3: Asignación y Ciclo de Préstamo Exitoso'),
                    createP('1. Dirigirse a la pestaña "02 // CATÁLOGO & INVENTARIO".'),
                    createP('2. Localizar un equipo con badge verde [DISPONIBLE] (ejemplo: EQ-GEN-01 Generador de Formas Siglent).'),
                    createP('3. Hacer clic en el botón de acción rápida: "⚡ SOLICITAR PRÉSTAMO".'),
                    createP('4. Observar que el instrumento queda preseleccionado con sus datos técnicos.'),
                    createP('5. En el campo "PLAZO LÍMITE", hacer clic en el chip rápido "+3 Días".'),
                    createP('6. En el campo "PROPÓSITO", ingresar: "Pruebas de inyección de señal senoidal de 10kHz en banco B".'),
                    createP('7. Hacer clic en "CONFIRMAR Y AUTORIZAR PRÉSTAMO".'),
                    createP('8. Escuchar el acorde de éxito emitido por Web Audio API y observar el Toast verde.'),
                    createP('9. Verificar que el equipo pasa automáticamente a estado PRESTADO y el contador del Dashboard se actualiza.'),
                    createCallout('RESULTADO ESPERADO DE PRÁCTICA 3', 'El préstamo se genera con su código PR-2026-XXXX y el equipo queda bloqueado para nuevos préstamos.', 'success'),

                    new Paragraph({ text: '', spacing: { after: 120 } }),

                    createH2('PRÁCTICA 4: Devolución con Condición Técnica (Bloqueo en Mantenimiento)'),
                    createP('1. Dirigirse a la pestaña "03 // PRÉSTAMOS & DEVOLUCIONES".'),
                    createP('2. En la tabla de préstamos en curso, hacer clic en "📥 REGISTRAR DEVOLUCIÓN" en el préstamo del generador.'),
                    createP('3. En el modal de recepción, marcar la condición: [CON OBSERVACIÓN].'),
                    createP('4. En el campo de observaciones técnicas, escribir: "Canal 2 con desfasaje térmico. Requiere calibración de oscilador".'),
                    createP('5. Hacer clic en "REGISTRAR DEVOLUCIÓN FORMAL".'),
                    createP('6. Verificar que el préstamo pasa a estado DEVUELTO.'),
                    createP('7. Dirigirse al Catálogo y verificar que el equipo quedó en estado: [EN MANTENIMIENTO].'),
                    createP('8. Ir al Centro Táctico (Dashboard) y verificar en el feed de auditoría que la transición quedó registrada con fecha, hora y responsable.'),
                    createCallout('RESULTADO ESPERADO DE PRÁCTICA 4', 'La regla de negocio número 3 garantiza que ningún instrumento con falla vuelva a catálogo sin previa intervención técnica.', 'success'),

                    new Paragraph({ text: '', spacing: { after: 120 } }),

                    createH2('PRÁCTICA 5: Auditoría Métrico-Algorítmica COCOMO II'),
                    createP('1. En la barra de navegación, hacer clic en la pestaña "05 // ESTIMACIÓN COCOMO II".'),
                    createP('2. Observar los medidores del proyecto en tiempo real:'),
                    createP('   - Total Líneas de Código Neto (SLOC): ~5,400 líneas.'),
                    createP('   - Tamaño del Software: ~5.40 KSLOC.'),
                    createP('   - Esfuerzo Estimado: ~17.3 Persona-Meses (PM).'),
                    createP('   - Tiempo de Desarrollo: ~8.2 Meses calendario (TDEV).'),
                    createP('   - Personal Óptimo Recomendado: 2.1 Ingenieros full-time.'),
                    createP('3. Explicar las fórmulas aplicadas: PM = 2.94 * (KSLOC)^1.05 y TDEV = 3.67 * (PM)^0.28.'),
                    createP('4. Mostrar el gráfico porcentual de las 3 capas arquitectónicas y la tabla detallada de inventario archivo por archivo.'),
                    createCallout('RESULTADO ESPERADO DE PRÁCTICA 5', 'Evidencia el rigor formal de Ingeniería de Software aplicado al dimensionamiento y costeo del software desarrollado.', 'info'),

                    new Paragraph({ text: '', spacing: { after: 200 } }),

                    // SECCIÓN 6: CONCLUSIÓN
                    createH1('6. CONCLUSIÓN GENERAL'),
                    createP('El proyecto AETHER LAB demuestra el dominio completo de la ingeniería de software aplicada: arquitectura desacoplada en 3 capas, interfaz cinematográfica táctica con excelente experiencia de usuario, seguridad criptográfica con bcrypt y tokens JWT, transacciones ACID con reglas de negocio obligatorias y una base de datos relacional operativa en Microsoft SQL Server. El sistema se encuentra probado y listo para su defensa y puesta en producción.')
                ]
            }
        ]
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, '..', 'INFORME_TECNICO_PRACTICAS_AETHER_LAB.docx');
    fs.writeFileSync(outputPath, buffer);
    console.log('[WORD] Documento generado exitosamente en:', outputPath);
}

buildDocx().catch(err => {
    console.error('Error al generar Word:', err);
    process.exit(1);
});
