# 🛰️ AETHER LAB // Control de Préstamos de Equipos y Herramientas
> **Sistema Táctico de Inventario, Gestión de Préstamos y Evaluación de Retorno de Instrumental de Precisión.**

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-v22+-00E5FF.svg?style=for-the-badge&logo=node.js&logoColor=black)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.21-00E5FF.svg?style=for-the-badge&logo=express&logoColor=black)](https://expressjs.com/)
[![SQL Server](https://img.shields.io/badge/Microsoft_SQL_Server-2022-CC292B.svg?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Security](https://img.shields.io/badge/Security-bcrypt%20%2B%20JWT%20RBAC-00E676.svg?style=for-the-badge)](https://jwt.io/)
[![COCOMO II](https://img.shields.io/badge/COCOMO_II-Live_Audited-B388FF.svg?style=for-the-badge)](#-7-estimación-métrica-cocomo-ii)
[![License](https://img.shields.io/badge/License-MIT-FFB300.svg?style=for-the-badge)](#)

**Autora:** Leticia Aquise Taco &nbsp;|&nbsp; **Materia:** INS600 — Examen Práctico / Proyecto Final &nbsp;|&nbsp; **Año:** 2026

[🚀 Inicio Rápido](#-5-inicio-rápido) • [🏛️ Arquitectura](#-2-arquitectura-en-3-capas) • [🛡️ Reglas de Negocio](#-3-reglas-de-negocio-obligatorias) • [🗄️ Base de Datos](#-4-base-de-datos-sql-server) • [📐 COCOMO II](#-7-estimación-métrica-cocomo-ii) • [📄 Documentación Word](#-8-entregables-incluidos)

</div>

---

## 📖 1. Descripción del Proyecto

**AETHER LAB** es una plataforma web full-stack de grado de ingeniería diseñada bajo el patrón de **Arquitectura en 3 Capas**. Automatiza y garantiza el control estricto de préstamos, trazabilidad y evaluación de retorno de herramientas e instrumental técnico de alta precisión (osciloscopios, fuentes de poder, multímetros de banco, estaciones de soldadura, analizadores lógicos, cámaras termográficas e impresoras 3D).

### 🌌 Estética Visual Cinematográfica HUD
- **Modo Oscuro Profundo:** Fondo espacial táctico `#070B14` con mallas de radar tenues.
- **Glassmorphism Táctico:** Superficies translúcidas con desenfoque de fondo (`backdrop-filter: blur(14px)`).
- **Acentos Luminosos:** Cian eléctrico `#00E5FF`, esmeralda `#00E676`, ámbar `#FFB300` y coral `#FF1744`.
- **Audio Procedural Táctico:** Retroalimentación acústica interactiva sintetizada mediante **Web Audio API** nativo (sin dependencias de archivos `.mp3`).
- **Modo Acceso Rápido:** Botones de demostración en 1-clic con 4 perfiles preconfigurados para evaluación en vivo.

---

## 🏛️ 2. Arquitectura en 3 Capas

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CAPA 1: PRESENTACIÓN (UI/UX)                      │
│   • Dashboard HUD con KPIs en Tiempo Real                              │
│   • Catálogo Interactivo con Búsqueda y Filtros por Estado/Categoría   │
│   • Consola Transaccional de Préstamos y Devolución con Inspección     │
│   • Directorio RBAC y Auditoría Métrica COCOMO II                      │
│   Tecnologías: HTML5 Semántico + CSS3 Variables + Vanilla JS Moderno   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / JSON (Bearer JWT)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  CAPA 2: LÓGICA DE NEGOCIO / CONTROLADOR               │
│   Node.js + Express 4.x                                                │
│   • Rutas API REST: /api/auth, /api/equipos, /api/prestamos, /metricas │
│   • Middleware RBAC: Control de acceso basado en roles                 │
│   • Seguridad Criptográfica: Encriptación con bcrypt (salt cost 10)    │
│   • Motor de Reglas: Validación atómica de disponibilidad y retorno    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Consultas Transaccionales (ACID)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    CAPA 3: ACCESO A DATOS (SQL RELACIONAL)             │
│   Microsoft SQL Server (LETICIA\SQLEXPRESS) + SQLite Nativo Node 22   │
│   • Tablas: usuarios, equipos, prestamos, historial_estados            │
│   • Integridad: PRIMARY KEY, FOREIGN KEY, CHECK Constraints, Índices   │
│   • Script único: AETHER_LAB_SQLSERVER.sql                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 3. Reglas de Negocio Obligatorias

| # | Regla de Negocio | Comportamiento del Sistema |
| :-: | :--- | :--- |
| **01** | **Préstamo Exclusivo de Equipos Disponibles** | Un equipo **solo puede prestarse si su estado es `DISPONIBLE`**. Si está `PRESTADO`, `EN_MANTENIMIENTO` o `DANADO`, la API rechaza la operación con código HTTP 400 y mensaje de alerta. |
| **02** | **Transición Automática a Préstamo** | Al aprobarse el préstamo, el equipo pasa automáticamente a estado **`PRESTADO`** dentro de una transacción atómica, registrándose la fecha, solicitante y fecha límite. |
| **03** | **Retorno con Evaluación Técnica** | Al registrar la devolución, se exige reportar la condición física/técnica del equipo:<br>• **`OPERATIVO`** $\rightarrow$ Pasa a **`DISPONIBLE`** (habilitado de inmediato).<br>• **`CON OBSERVACIÓN`** $\rightarrow$ Pasa a **`EN MANTENIMIENTO`** (**bloqueado** para préstamos).<br>• **`DAÑADO`** $\rightarrow$ Pasa a **`DAÑADO`** (**bloqueado** hasta peritaje/reparación). |
| **04** | **Pista de Auditoría Técnica** | Cada cambio de estado manual o transaccional se asienta en la tabla `historial_estados` con sello de tiempo, responsable y motivo. |

---

## 🗄️ 4. Base de Datos SQL Server

El proyecto incluye el script único [AETHER_LAB_SQLSERVER.sql](AETHER_LAB_SQLSERVER.sql) configurado para **Microsoft SQL Server (`LETICIA\SQLEXPRESS`)**:

```sql
-- Ejecutar en SQL Server Management Studio (SSMS) conectándose a LETICIA\SQLEXPRESS:
USE AetherLab;
GO

SELECT 'Usuarios Registrados' AS Entidad, COUNT(*) AS Total FROM dbo.usuarios
UNION ALL
SELECT 'Equipos en Catálogo', COUNT(*) FROM dbo.equipos
UNION ALL
SELECT 'Préstamos Registrados', COUNT(*) FROM dbo.prestamos
UNION ALL
SELECT 'Historial de Estados', COUNT(*) FROM dbo.historial_estados;
GO
```

### Diccionario de Datos

| Tabla | Claves y Restricciones | Propósito |
| :--- | :--- | :--- |
| **`usuarios`** | `PK id (IDENTITY)`, `UNIQUE email`, `CHECK (rol IN ('ADMIN','ENCARGADO','OPERADOR','USUARIO'))` | Credenciales encriptadas con bcrypt y roles RBAC. |
| **`equipos`** | `PK id (IDENTITY)`, `UNIQUE codigo`, `CHECK (estado IN ('DISPONIBLE','PRESTADO','EN_MANTENIMIENTO','DANADO','DE_BAJA'))` | Instrumental técnico de laboratorio con especificaciones. |
| **`prestamos`** | `PK id (IDENTITY)`, `UNIQUE codigo_prestamo`, `FK equipo_id`, `FK usuario_id`, `CHECK (estado_prestamo IN ('ACTIVO','DEVUELTO','VENCIDO'))` | Transacciones de préstamo, plazos y condiciones de retorno. |
| **`historial_estados`** | `PK id (IDENTITY)`, `FK equipo_id (ON DELETE CASCADE)`, `FK usuario_id` | Trazabilidad y no-repudio de cambios de condición. |

---

## 🚀 5. Inicio Rápido

### Requisitos
- **Node.js:** v18+ (Recomendado Node v22.x).
- **SQL Server:** Instancia `LETICIA\SQLEXPRESS` (o SQLite integrado de cero configuración).
- **Navegador:** Chrome, Edge, Firefox o Brave.

### Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Aicitel-aquise/ProyectoFinal.git
   cd ProyectoFinal
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor:**
   ```bash
   npm start
   ```

4. **Acceder a la aplicación:**
   Abrir en el navegador: 👉 **`http://localhost:3000`**

---

## 🔑 6. Credenciales de Demostración (1-Clic)

La pantalla principal cuenta con tarjetas de acceso rápido para ingresar con 1 solo clic:

| Rol | Correo Institucional | Contraseña | Privilegios en el Sistema |
| :--- | :--- | :--- | :--- |
| **👑 ADMIN** | `admin@aetherlab.io` | `Admin123!` | Control Total, CRUD Equipos, Roles, Override Estados |
| **🔧 ENCARGADO** | `encargado@aetherlab.io` | `Encargado123!` | Alta/Edición Equipos, Recepción Devoluciones |
| **⚡ OPERADOR** | `operador@aetherlab.io` | `Operador123!` | Registro de Préstamos, Devoluciones, Catálogo |
| **🔬 INVESTIGADOR** | `investigador@aetherlab.io` | `Usuario123!` | Consulta de Inventario y Solicitudes Propias |

---

## 📐 7. Estimación Métrica COCOMO II

El sistema incorpora en su pestaña **05 // ESTIMACIÓN COCOMO II** un motor de auditoría dinámico sobre el árbol de código fuente:

```
┌────────────────────────────────────────────────────────────────┐
│               PARÁMETROS DEL MODELO COCOMO II                  │
├──────────────────────────────┬─────────────────────────────────┤
│ Líneas de Código Neto (SLOC) │ ~5,400 SLOC                     │
│ Tamaño del Sistema (KSLOC)   │ 5.40 KSLOC                      │
│ Modo de Proyecto             │ Semi-Detached (Sistemas Web)    │
│ Ecuación de Esfuerzo (PM)    │ PM = 2.94 × (KSLOC)^1.05        │
│ Esfuerzo Estimado            │ ~17.3 Persona-Meses (PM)        │
│ Ecuación de Tiempo (TDEV)    │ TDEV = 3.67 × (PM)^0.28         │
│ Tiempo de Desarrollo Óptimo  │ ~8.2 Meses Calendario           │
│ Personal Promedio            │ 2.1 Ingenieros                  │
└──────────────────────────────┴─────────────────────────────────┘
```

---

## 📄 8. Entregables Incluidos en el Repositorio

- 📘 **[INFORME_TECNICO_PRACTICAS_AETHER_LAB.docx](INFORME_TECNICO_PRACTICAS_AETHER_LAB.docx):** Informe formal en formato Microsoft Word con manual de prácticas campo por campo y tablas técnicas.
- 📝 **[INFORME_TECNICO.md](INFORME_TECNICO.md):** Versión Markdown completa con diagramas de flujo y arquitectura.
- 🗄️ **[AETHER_LAB_SQLSERVER.sql](AETHER_LAB_SQLSERVER.sql):** Script único autoejecutable para Microsoft SQL Server (`LETICIA\SQLEXPRESS`).
- 🖥️ **`frontend/`:** Interfaz web táctica HUD cinematográfica (`index.html`, `styles.css`, `app.js`).
- ⚙️ **`backend/`:** Servidor Express, middleware RBAC, rutas REST y motor de base de datos.

---

<div align="center">

**AETHER LAB // Engineered for Mission-Critical Laboratory Operations**  
*Desarrollado por Leticia Aquise Taco — 2026*

</div>
