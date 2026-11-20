# 🚐 SISTEMA DE CONTROL Y GESTIÓN OPERATIVA - SINDICATO DE MINIBUSES
### Examen Final Práctico · INS-600 Ingeniería de Software
**Estudiante:** Leticia Aquise Taco  
**Carrera:** Informática Industrial · I.T. Escuela Industrial Superior Pedro Domingo Murillo  
**Docente:** Lic. Erik Huallpa Aruquipa  
**Propuesta Asignada:** Propuesta 15 · Sindicato de Minibuses (La Paz - El Alto)  

---

## 🌟 1. FICHA TÉCNICA Y ARQUITECTURA DEL SISTEMA

| Capa / Componente | Tecnología | Descripción |
|---|---|---|
| **Backend REST API** | C# · ASP.NET Core Web API (.NET 10) | Endpoints RESTful con Entity Framework Core, validaciones de reglas de negocio y Swagger UI. |
| **Base de Datos** | Microsoft SQL Server Express | Instancia `LETICIA\SQLEXPRESS`, BD `SindicatoMinibusesDB` con integridad referencial estricta. |
| **Frontend Web** | Vue.js 3 (CDN Proactivo) + Bootstrap 5 | Interfaz táctil reactiva, diseño Glassmorphism HUD táctico y sintetizador Web Audio FX. |
| **Seguridad** | JWT (JSON Web Tokens) + BCrypt | Roles (`Secretario` y `Controlador`), contraseñas encriptadas con algoritmo Blowfish (BCrypt). |
| **Nomenclatura Estricta** | Sufijo Obligatorio `_js` | Todas las tablas, columnas SQL, propiedades en C# y JSON llevan el sufijo `_js`. |
| **Túnel y Acceso Remoto** | Cloudflare Tunnel (`cloudflared`) | Publicación segura HTTPS sin abrir puertos ni configuraciones en el router. |
| **Empaquetado** | Inno Setup 6 | Instalador `.exe` autoejecutable para Windows con script `.iss`. |

---

## 🚀 2. INICIO RÁPIDO CON 1 SOLO CLIC

Para ejecutar todo el sistema automáticamente (Backend API + Frontend + Túnel Cloudflare para celulares):

1. Abre la carpeta del proyecto.
2. Haz doble clic en **`INICIAR_SISTEMA.bat`**.
3. La consola iniciará la API y te mostrará el enlace público para el celular del docente:
   - **Local:** `http://localhost:5136/index.html`
   - **Documentación Swagger:** `http://localhost:5136/swagger`
   - **Enlace Remoto (Celulares/Docente):** `https://[subdominio].trycloudflare.com`

### 🔑 Credenciales Oficiales de Evaluación:
| Usuario (`nombre_usuario_js`) | Contraseña (`password_js`) | Rol (`rol_js`) | Permisos y Alcance |
|---|---|---|---|
| **Honorato Ticona** | `secretario123` | **Secretario** (Hacienda) | Acceso total: Hojas, Cobros, Padrón Afiliados, Vehículos y Reporte de Recaudación. |
| **Irma Calle** | `controlador123` | **Controlador** (Parada) | Acceso operativo: Emisión instantánea de Hojas de Ruta y Cobro de Aportes. |

*(La pantalla de inicio cuenta con botones de acceso rápido con 1 clic para ambos usuarios).*

---

## 📑 3. RESOLUCIÓN DETALLADA DEL EXAMEN (PARTES A - J)

---

### PARTE A · Análisis del Problema y Requerimientos

#### A.1 Stakeholders y Expectativas:
1. **Honorato Ticona (Secretario de Hacienda):**
   - Requiere mantener actualizado el padrón sindical de afiliados y sus minibuses asignados.
   - Necesita consultar la recaudación del día en tiempo real y conocer qué afiliados tienen deudas acumuladas.
2. **Irma Calle (Controladora de Parada):**
   - Requiere emitir la hoja de ruta en cuestión de segundos desde su teléfono celular.
   - Necesita que el sistema bloquee automáticamente a minibuses morosos y registrar pagos sin demoras.
3. **Afiliados y Choferes del Sindicato:**
   - Esperan que su aporte diario reglamentario (Bs 10.00) sea registrado de forma transparente para evitar cobros dobles y garantizar su derecho a trabajar en ruta.

#### A.2 Requisitos Funcionales (RF):
- **RF-01 (Autenticación y Autorización por Roles):** Login seguro mediante JWT discriminando privilegios entre Secretario y Controlador.
- **RF-02 (Gestión del Padrón Sindical - CRUD):** Mantenimiento completo de Afiliados (nombre, celular) y Vehículos (placa, línea, afiliado dueño).
- **RF-03 (Emisión de Hojas de Ruta - Proceso Central):** Registro de la hoja diaria de un vehículo validando tarifa reglamentaria fija de Bs 10.00 y condición de pago (`Pagado` o `Pendiente`).
- **RF-04 (Cobro Rápido de Aportes Pendientes):** Interfaz ágil para cancelar deudas pendientes con actualización inmediata en el saldo de recaudación.
- **RF-05 (Reporte Consolidado de Hacienda):** Visualización del total recaudado en el día, total pendiente por cobrar y detalle desglosado por afiliado y minibus.

#### A.3 Requisitos No Funcionales (RNF):
- **RNF-01 (Diseño Móvil First y Ergonomía):** Pantallas optimizadas para teléfonos móviles táctiles en paradas de minibuses (tiempo de registro < 3 segundos).
- **RNF-02 (Seguridad Criptográfica):** Almacenamiento de contraseñas con salado criptográfico BCrypt y protección de endpoints con Bearer Token JWT.
- **RNF-03 (Disponibilidad y CORS Abierto):** Configuración de políticas CORS `AllowAll` para interoperabilidad multiplataforma.

#### A.4 Reglas de Negocio Programadas (RN):
- **RN-01 (Placa Única Case-Insensitive):** No pueden existir dos minibuses con la misma placa registrada en el sindicato, sin importar si se escribe en mayúsculas o minúsculas.
- **RN-02 (Límite de Una Hoja Diaria por Minibús):** Un vehículo no puede recibir más de una hoja de ruta en la misma fecha calendario.
- **RN-03 (Bloqueo Automático por Morosidad - 3+ Deudas):** Se bloquea la emisión de hoja de ruta a cualquier vehículo que acumule 3 o más aportes con estado `Pendiente`. El sistema emite alarma sonora y alerta visual en pantalla.
- **RN-04 (Cobro Único de Aporte):** Un aporte marcado como `Pagado` queda bloqueado y no puede ser cobrado nuevamente.

---

### PARTE B · Arquitectura Técnica y Endpoints REST (.NET)

La API está estructurada en controladores dedicados con inyección de dependencias:

```
SindicatoMinibusesAPI/
├── Controllers/
│   ├── AuthController.cs          --> Login JWT y generación de tokens seguros
│   ├── SindicatoController.cs     --> CRUD Afiliados, Vehículos, Hojas y Reporte
│   └── HojasRutaController.cs     --> Listado y proyección detallada
├── Data/
│   └── AppDbContext.cs            --> Contexto EF Core y mapeo de tablas _js
├── Models/
│   ├── Usuario.cs, Afiliado.cs, Vehiculo.cs, HojaRuta.cs, Aporte.cs
└── wwwroot/                       --> Frontend distribuido listo para usar
```

#### Catálogo de Endpoints de la API:
| Método | Endpoint | Descripción | Rol Autorizado |
|---|---|---|---|
| `POST` | `/api/auth/login` | Autentica credenciales y emite Token JWT de 8 horas | Público |
| `GET` | `/api/sindicato/vehiculos` | Lista todos los minibuses y sus dueños | Secretario / Controlador |
| `POST` | `/api/sindicato/vehiculos` | Registra vehículo validando RN-01 (Placa única) | Solo Secretario |
| `PUT` | `/api/sindicato/vehiculos/{id}` | Actualiza datos del vehículo | Solo Secretario |
| `DELETE`| `/api/sindicato/vehiculos/{id}` | Elimina vehículo del padrón | Solo Secretario |
| `GET` | `/api/sindicato/afiliados` | Lista todos los afiliados y teléfonos | Secretario / Controlador |
| `POST` | `/api/sindicato/afiliados` | Registra nuevo afiliado | Solo Secretario |
| `PUT` | `/api/sindicato/afiliados/{id}` | Edita afiliado | Solo Secretario |
| `DELETE`| `/api/sindicato/afiliados/{id}` | Elimina afiliado | Solo Secretario |
| `GET` | `/api/hojasruta` | Lista hojas de ruta emitidas con datos del vehículo | Ambos Roles |
| `POST` | `/api/sindicato/hojas-ruta` | Emite hoja validando RN-02 y RN-03 (Proceso Central) | Ambos Roles |
| `PUT` | `/api/sindicato/aportes/pagar/{id}`| Cobra aporte pendiente validando RN-04 | Ambos Roles |
| `GET` | `/api/sindicato/reportes/recaudacion`| Genera métricas de caja y deudas por afiliado | Solo Secretario |

---

### PARTE C · Base de Datos Relacional (SQL Server)

El script SQL completo se encuentra en [`database_sindicato_minibuses.sql`](database_sindicato_minibuses.sql).

#### Diagrama de Entidad-Relación Lógico:
```
[Usuarios]
  id_usuario_js (PK)
  nombre_usuario_js
  password_hash_js
  rol_js
  nombre_js

[Afiliados] (1) <─────── (N) [Vehiculos] (1) <─────── (N) [HojasRuta]
  id_afiliado_js (PK)          id_vehiculo_js (PK)          id_hoja_ruta_js (PK)
  nombre_js                    placa_js (UNIQUE)            id_vehiculo_js (FK)
  celular_js                   linea_js                     fecha_emision_js
                               id_afiliado_js (FK)          monto_js (Bs 10.00)
                                                            aporte_pagado_js (BIT)
                                                            nombre_controlador_js
```

---

### PARTE D · Control de Versiones Git y Flujo de Ramas

El repositorio cuenta con la estructura exigida en el examen, incluyendo la rama `feature/proceso-central` mergeada en `main`:

```bash
# Historial de commits verificable con git log:
* 57a4d7b Fix: tunel Cloudflare activo, URL publica generada y README actualizado con parte G
* 0d26b3e Pruebas, documento del examen e instalador
* 71b1b43 Frontend en Vue.js, Angular o React conectado a la API
*   030c6f8 Merge branch 'feature/proceso-central' en main
|\  
| * 369dab2 Proceso central y reglas de negocio, en la rama feature
|/  
* 1d481c7 API con login y mantenimientos
* 16ffc57 Modelo de datos y migraciones
* 60c5e9e Proyecto creado, con .gitignore y README
```

---

### PARTE E · Frontend Reactivo (Vue.js 3 + Glassmorphism HUD)

- **Tecnología:** Vue.js 3 Composition/Options API cargado vía CDN ultraligero sin sobrecargar node_modules.
- **Estética:** Glassmorphism futurista táctico con contraste optimizado para lectura en pantallas móviles bajo luz solar.
- **Audio Sintetizado:** Efectos sonoros integrados con Web Audio API (`click`, `success`, `alarm` para bloqueos).
- **Responsive:** Adaptable a teléfonos móviles (controlador en parada) y monitores de escritorio (secretario).

---

### PARTE F · Matriz de Casos de Prueba (Proceso Central y Reglas)

| Caso | Escenario Evaluado | Datos de Entrada | Resultado Esperado | Resultado en el Sistema | Estado |
|:---:|---|---|---|---|:---:|
| **CP-01** | Emisión exitosa con aporte pagado | Placa: `2345-KLP`, Pago: `Pagado` | Hoja registrada con estado Pagado (+Bs 10 en caja) | Registrado exitosamente | **APROBADO** |
| **CP-02** | Emisión exitosa con aporte al fiado | Placa: `1122-XZA`, Pago: `Pendiente` | Hoja registrada con estado Pendiente (+Bs 10 por cobrar) | Registrado con deuda | **APROBADO** |
| **CP-03** | **RN-03: Bloqueo por 3 o más deudas** | Placa: `9988-MNO` (3 deudas previas) | Bloqueo automático, Error 400 y Alarma en pantalla | Bloqueado con alerta roja | **APROBADO** |
| **CP-04** | **RN-02: Bloqueo por emisión duplicada en el día** | Placa: `2345-KLP` (ya emitida hoy) | Bloqueo con mensaje de una sola hoja por día | Bloqueado con alerta | **APROBADO** |
| **CP-05** | **RN-04: Cobro de aporte pendiente** | Hoja ID `#103` (Pendiente) | Cambia a `Pagado`, se suma a recaudación | Cobrado con éxito | **APROBADO** |
| **CP-06** | **RN-01: Registro de placa duplicada** | Placa: `2345-klp` (ya existente) | Rechazo por placa existente (case-insensitive) | Rechazado con mensaje | **APROBADO** |

---

### PARTE G · Publicación en Línea con Túnel

El sistema se publica mediante **Cloudflare Tunnel (`cloudflared`)**, permitiendo al docente evaluar el sistema desde su propio dispositivo móvil:

```bash
# Comando ejecutado automáticamente por INICIAR_SISTEMA.bat:
cloudflared tunnel --url http://localhost:5136
```

---

### PARTE H · Instalador de Escritorio para Windows

El instalador para Windows se compila con **Inno Setup** utilizando el archivo de configuración [`instalador_sindicato.iss`](instalador_sindicato.iss). Genera un paquete autoejecutable que instala el sistema y crea los accesos directos de escritorio.

---

### PARTE I · Manual de Usuario Breve

1. **Como Controlador (Irma Calle):**
   - Entra al sistema con un clic en el botón **Irma Calle**.
   - En la pestaña **Emisión Hojas de Ruta**, elige el minibús por placa.
   - Si el vehículo tiene deudas, el sistema te avisará de inmediato.
   - Selecciona si paga ahora o queda pendiente y presiona **Emitir Hoja de Ruta**.
   - En la pestaña **Cobro de Aportes**, puedes cobrar las deudas pendientes con el botón verde.

2. **Como Secretario de Hacienda (Honorato Ticona):**
   - Entra con el botón **Honorato Ticona**.
   - Puedes ver todas las pestañas de Irma más:
   - **Vehículos:** Para agregar o editar minibuses del sindicato.
   - **Afiliados:** Para registrar nuevos choferes o dueños con su número celular.
   - **Reporte de Hacienda:** Muestra la recaudación total del día, montos por cobrar y estado de cada afiliado.

---

### PARTE J · Conclusión y Criterios Cumplidos

El proyecto cubre al 100% las partes A a J del Examen Final INS-600:
- ✅ Backend en C# ASP.NET Core con SQL Server y nomenclatura `_js`.
- ✅ Frontend moderno en Vue.js conectado a la API con diseño responsive.
- ✅ Reglas de negocio programadas y validadas tanto en el Backend como en la interfaz.
- ✅ Roles diferenciados con tokens JWT.
- ✅ Repositorio Git con commits estructurados y rama feature mergeada.
- ✅ Publicación en línea mediante Cloudflare Tunnel y script `.bat` automatizado.
