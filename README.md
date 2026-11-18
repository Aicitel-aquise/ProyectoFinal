# 🚖 SISTEMA DE GESTIÓN - SINDICATO DE MINIBUSES (PROPUESTA 15)
### Examen Final Práctico - INS-600 Ingeniería de Software
**Estudiante:** Leticia Aquise Taco  
**Carrera:** Informática Industrial - I.T. Escuela Industrial Superior Pedro Domingo Murillo  
**Docente:** Lic. Erik Huallpa Aruquipa  

---

## 🌟 1. ARQUITECTURA TÉCNICA
- **Backend:** C# con ASP.NET Core Web API (.NET 8 / .NET 10), Entity Framework Core y SQL Server.
- **Frontend:** Vue.js 3 (CDN), Bootstrap 5, diseño cibernético Glassmorphism HUD táctico y sintetizador Web Audio API.
- **Seguridad:** Autenticación JWT (JSON Web Tokens) guardados en `localStorage`, roles diferenciados y contraseñas hasheadas.
- **Nomenclatura Estricta:** Todas las tablas, columnas y propiedades usan el sufijo obligatorio `_js`.

---

## 📑 2. GUÍA DE RESOLUCIÓN DEL EXAMEN (PARTES A - J)

### PARTE A · Análisis del Problema
#### A.1 Stakeholders y qué espera cada uno:
1. **Honorato Ticona (Secretario de Hacienda):** Espera registrar afiliados y vehículos, ver la recaudación diaria en tiempo real y controlar que ningún afiliado tenga deudas pendientes acumuladas.
2. **Irma Calle (Controladora de Parada):** Espera una interfaz ágil en su teléfono celular para emitir hojas de ruta en segundos, validar bloqueos de inmediato y cobrar aportes pendientes sin duplicidad.
3. **Afiliados / Dueños de Minibuses:** Esperan que sus aportes diarios (Bs 10) queden debidamente registrados, garantizando que nadie les cobre dos veces y asegurando su hoja de ruta diaria.

#### A.2 Requisitos y Reglas de Negocio:
- **RF-01 (Autenticación por Roles):** El sistema debe permitir el inicio de sesión mediante credenciales (`nombre_usuario_js`, `password_js`) asignando permisos a Secretario de Hacienda y Controlador de Parada.
- **RF-02 (Mantenimiento de Padrón):** El sistema debe permitir registrar, listar, editar y eliminar Afiliados y Vehículos (exclusivo para el Secretario).
- **RF-03 (Emisión de Hoja de Ruta):** El sistema debe registrar la emisión diaria de la hoja de ruta indicando si el aporte de Bs 10 fue pagado o queda pendiente.
- **RF-04 (Cobro de Aportes Pendientes):** El sistema debe permitir marcar un aporte como cobrado mediante un solo toque/clic.
- **RF-05 (Reporte de Recaudación y Deudas):** El sistema debe generar un reporte diario exclusivo para el secretario con las hojas emitidas hoy, la recaudación total y el detalle por afiliado (vehículos, total aportado y deuda).
- **RNF-01 (Rendimiento Móvil):** La interfaz debe estar optimizada para dispositivos móviles táctiles y registrar una hoja en menos de 3 segundos.
- **RNF-02 (Seguridad):** Las contraseñas deben estar cifradas y los endpoints protegidos por Bearer Token JWT.
- **RNF-03 (Disponibilidad y CORS):** La API REST debe responder en formato JSON y permitir peticiones cruzadas (CORS abierto AllowAll).
- **RN-01 (Placa Única):** La placa de cada vehículo es única en el sindicato, sin importar si se escribe con mayúsculas o minúsculas.
- **RN-02 (Límite Diario):** Un vehículo recibe una sola hoja de ruta por día.
- **RN-03 (Bloqueo por Deudas):** No se emite hoja de ruta a ningún vehículo que cuente con 3 o más aportes pendientes acumulados; primero debe ponerse al día.
- **RN-04 (Pago Único):** Un aporte cobrado no se cobra otra vez.

#### A.3 Especificación del Caso de Uso: "Emitir Hoja de Ruta Diaria"
- **Actor:** Controlador de parada (Irma Calle).
- **Precondición:** El vehículo debe estar registrado en el padrón y no contar con hoja de ruta emitida en el día.
- **Flujo Básico:**
  1. El controlador selecciona el minibús por su placa (`id_vehiculo_js`).
  2. El sistema valida automáticamente las deudas pendientes del vehículo.
  3. El controlador indica el estado del aporte (`Pagado` o `Pendiente`).
  4. El sistema registra la hoja con fecha/hora actual y aporte fijo de Bs 10.
  5. El sistema confirma la emisión y actualiza la lista en vivo.
- **Flujo Alterno:** El vehículo cuenta con 3 o más aportes pendientes. El sistema bloquea la emisión, emite una alarma sonora y despliega una alerta visual crítica en pantalla indicando que debe cancelar su deuda antes de recibir la hoja.
- **Postcondición:** Hoja de ruta generada con ID único y el vehículo habilitado para trabajar.

---

### PARTE B · Arquitectura y Endpoints de la API (.NET)

#### B.2 Tabla de Endpoints Reales:
| N.° | Método | Ruta de la API | Qué hace | Rol que puede usarlo |
|---|---|---|---|---|
| **1** | `POST` | `/api/auth/login` | Autentica usuario y devuelve Token JWT con rol | Todos los usuarios |
| **2** | `GET` | `/api/hojasruta` | Lista las hojas de ruta y estado de aportes | Secretario y Controlador |
| **3** | `POST` | `/api/hojasruta` | Emite hoja diaria validando las 3 reglas de negocio | Controlador y Secretario |
| **4** | `PUT` | `/api/hojasruta/{id}/cobrar` | Marca un aporte pendiente como cobrado | Controlador y Secretario |
| **5** | `POST` | `/api/vehiculos` | Registra minibús validando placa única case-insensitive | Solo Secretario |
| **6** | `GET` | `/api/reportes/diario` | Genera métricas de recaudación y deudas por afiliado | Solo Secretario |

---

### PARTE D · Commits Recomendados para Git
1. `git commit -m "Proyecto creado, con .gitignore y README"`
2. `git commit -m "Modelo de datos y migraciones"`
3. `git commit -m "API con login y mantenimientos"`
4. `git commit -m "Proceso central y reglas de negocio, en la rama feature"`
5. `git commit -m "Frontend en Vue.js con Bootstrap conectado a la API"`
6. `git commit -m "Pruebas, documento del examen e instalador"`

---

### PARTE F · Casos de Prueba (Proceso Central)
| ID | Qué se prueba | Datos de entrada | Resultado esperado | Resultado obtenido | ¿Pasó? |
|---|---|---|---|---|:---:|
| **CP-01** | Emisión normal con aporte pagado | Placa: 2345-KLP, Estado: Pagado | Emisión exitosa, estado cobrado | Hoja emitida y registrada | SÍ |
| **CP-02** | Emisión normal con aporte a crédito | Placa: 1122-XZA, Estado: Pendiente | Emisión exitosa, aporte por cobrar | Hoja emitida con deuda | SÍ |
| **CP-03** | Bloqueo por 3 o más aportes pendientes (RN-03) | Placa: 9988-MNO (3 deudas) | Error 400 y Alerta Crítica en pantalla | Bloqueado con alerta visual | SÍ |
| **CP-04** | Bloqueo por segunda emisión en el mismo día (RN-02) | Placa: 2345-KLP (ya emitida hoy) | Bloqueo de emisión diaria | Mensaje de restricción diaria | SÍ |
| **CP-05** | Cobro de aporte pendiente (RN-04) | Hoja ID #103 (Pendiente) | Cambia a Pagado y suma a recaudación | Cobrado exitosamente | SÍ |

---

### PARTE G · Publicación en Línea con Túnel
Para abrir el sistema desde el celular del docente:
```bash
# Opción 1: ngrok
ngrok http 5000

# Opción 2: Cloudflare Tunnel
cloudflared tunnel --url http://localhost:5000
```

---

## 🚀 3. CÓMO EJECUTAR EL FRONTEND
1. Abre esta carpeta en **Visual Studio Code**.
2. Haz clic derecho en `index.html` y selecciona **Open with Live Server** (o ábrelo directamente en tu navegador Google Chrome o Edge).
3. Utiliza los botones de **Acceso Rápido** en la pantalla de inicio:
   - **Honorato Ticona** (Secretario de Hacienda): Acceso completo a Afiliados, Vehículos y Reportes.
   - **Irma Calle** (Controladora de Parada): Acceso táctil optimizado para emisión rápida y cobros.
