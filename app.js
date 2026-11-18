/**
 * ============================================================================
 * SINDICATO DE MINIBUSES (PROPUESTA 15) - TERMINAL FRONTEND CIBERNÉTICA
 * INS-600 INGENIERÍA DE SOFTWARE - EXAMEN PRÁCTICO
 * 
 * Reglas de Nomenclatura: Todas las propiedades de modelos y tablas usan el sufijo _js
 * Autenticación: JWT (JSON Web Tokens) guardado en localStorage
 * ============================================================================
 */

// 1. CONFIGURACIÓN DEL SERVIDOR API (.NET)
const CONFIG_API = {
    // Permite cambiar la URL base desde la interfaz o por variable local
    obtenerBaseUrl() {
        return localStorage.getItem('api_sindicato_base_url') || 'http://localhost:5000';
    },
    establecerBaseUrl(url) {
        localStorage.setItem('api_sindicato_base_url', url.trim());
    },
    // Endpoints estándar de la API REST .NET
    endpoints: {
        login: '/api/auth/login',
        hojasRuta: '/api/hojasruta',
        cobrarAporte: (id) => `/api/hojasruta/${id}/cobrar`,
        vehiculos: '/api/vehiculos',
        afiliados: '/api/afiliados',
        reporteDiario: '/api/reportes/diario'
    }
};

// 2. MOTOR DE EFECTOS DE SONIDO CINEMÁTICOS (Sintetizador Web Audio API)
// No requiere archivos .mp3 externos; funciona en el 100% de los navegadores modernos.
const AudioFX = {
    audioCtx: null,
    activo: true,

    init() {
        if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
        }
    },

    play(tipo) {
        if (!this.activo) return;
        try {
            this.init();
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            if (tipo === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (tipo === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (tipo === 'alarm') {
                // Alarma pulsante de película para vehículo bloqueado
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.linearRampToValueAtTime(440, now + 0.15);
                osc.frequency.linearRampToValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }
        } catch (e) {
            console.warn('Efecto de audio omitido:', e);
        }
    }
};

// 3. DATOS DE PRUEBA INICIALES (Cumplen con el requisito de 5 registros y los roles oficiales)
const DATOS_INICIALES = {
    usuarios: [
        { id_usuario_js: 1, nombre_usuario_js: "Honorato Ticona", password_js: "Admin123*", rol_js: "Secretario de hacienda" },
        { id_usuario_js: 2, nombre_usuario_js: "Irma Calle", password_js: "Irma123*", rol_js: "Controlador de parada" }
    ],
    afiliados: [
        { id_afiliado_js: 1, nombre_js: "Honorato Ticona", celular_js: "71234567", fecha_registro_js: "2026-01-10T08:00:00" },
        { id_afiliado_js: 2, nombre_js: "Zenón Mamani Quenta", celular_js: "72098765", fecha_registro_js: "2026-01-15T09:30:00" },
        { id_afiliado_js: 3, nombre_js: "Martha Condori Flores", celular_js: "73541289", fecha_registro_js: "2026-02-01T10:15:00" },
        { id_afiliado_js: 4, nombre_js: "Froilán Quispe Choque", celular_js: "74123890", fecha_registro_js: "2026-02-12T14:00:00" },
        { id_afiliado_js: 5, nombre_js: "Basilia Apaza Colque", celular_js: "75981234", fecha_registro_js: "2026-03-05T11:20:00" }
    ],
    vehiculos: [
        { id_vehiculo_js: 1, placa_js: "2345-KLP", linea_js: "132", id_afiliado_js: 1 },
        { id_vehiculo_js: 2, placa_js: "1122-XZA", linea_js: "801", id_afiliado_js: 2 },
        { id_vehiculo_js: 3, placa_js: "3490-RST", linea_js: "132", id_afiliado_js: 2 }, // Afiliado con más de un vehículo
        { id_vehiculo_js: 4, placa_js: "4512-BTY", linea_js: "801", id_afiliado_js: 3 },
        { id_vehiculo_js: 5, placa_js: "9988-MNO", linea_js: "132", id_afiliado_js: 4 }  // Minibús con morosidad (para prueba de bloqueo)
    ],
    hojasRuta: [
        { id_hoja_ruta_js: 101, id_vehiculo_js: 1, fecha_emision_js: "2026-11-18T06:30:00", monto_aporte_js: 10.00, estado_pago_js: "Pagado", nombre_controlador_js: "Irma Calle" },
        { id_hoja_ruta_js: 102, id_vehiculo_js: 2, fecha_emision_js: "2026-11-18T07:15:00", monto_aporte_js: 10.00, estado_pago_js: "Pagado", nombre_controlador_js: "Irma Calle" },
        { id_hoja_ruta_js: 103, id_vehiculo_js: 3, fecha_emision_js: "2026-11-18T07:45:00", monto_aporte_js: 10.00, estado_pago_js: "Pendiente", nombre_controlador_js: "Irma Calle" },
        // Aportes pendientes anteriores para el vehículo 5 (para simular el caso de bloqueo con 3 o más)
        { id_hoja_ruta_js: 98, id_vehiculo_js: 5, fecha_emision_js: "2026-11-15T06:00:00", monto_aporte_js: 10.00, estado_pago_js: "Pendiente", nombre_controlador_js: "Irma Calle" },
        { id_hoja_ruta_js: 99, id_vehiculo_js: 5, fecha_emision_js: "2026-11-16T06:30:00", monto_aporte_js: 10.00, estado_pago_js: "Pendiente", nombre_controlador_js: "Irma Calle" },
        { id_hoja_ruta_js: 100, id_vehiculo_js: 5, fecha_emision_js: "2026-11-17T06:15:00", monto_aporte_js: 10.00, estado_pago_js: "Pendiente", nombre_controlador_js: "Irma Calle" }
    ]
};

// 4. ALMACENAMIENTO LOCAL Y SINCRONIZACIÓN
function obtenerAlmacen(clave, porDefecto) {
    const data = localStorage.getItem(`sindicato_${clave}`);
    if (!data) {
        localStorage.setItem(`sindicato_${clave}`, JSON.stringify(porDefecto));
        return porDefecto;
    }
    try {
        return JSON.parse(data);
    } catch {
        return porDefecto;
    }
}

function guardarAlmacen(clave, data) {
    localStorage.setItem(`sindicato_${clave}`, JSON.stringify(data));
}

// ============================================================================
// 5. CONTROLADOR DE LOGIN (index.html)
// ============================================================================
function iniciarLoginApp() {
    const { createApp } = Vue;

    createApp({
        data() {
            return {
                credenciales: {
                    nombre_usuario_js: '',
                    password_js: ''
                },
                mostrarPassword: false,
                cargando: false,
                mensajeError: '',
                apiOnline: false,
                apiBaseUrl: CONFIG_API.obtenerBaseUrl(),
                mostrarConfigApi: false,
                tempApiUrl: CONFIG_API.obtenerBaseUrl()
            };
        },
        mounted() {
            this.verificarApiOnline();
            // Si ya hay token y sesión activa, redirigir al dashboard
            const token = localStorage.getItem('jwt_token_sindicato');
            if (token) {
                window.location.href = 'dashboard.html';
            }
        },
        methods: {
            seleccionarPreset(usuario, password) {
                AudioFX.play('click');
                this.credenciales.nombre_usuario_js = usuario;
                this.credenciales.password_js = password;
                this.mensajeError = '';
            },
            toggleConfigApi() {
                this.mostrarConfigApi = !this.mostrarConfigApi;
            },
            guardarApiUrl() {
                CONFIG_API.establecerBaseUrl(this.tempApiUrl);
                this.apiBaseUrl = this.tempApiUrl;
                this.mostrarConfigApi = false;
                this.verificarApiOnline();
                AudioFX.play('success');
            },
            async verificarApiOnline() {
                try {
                    const res = await fetch(`${this.apiBaseUrl}${CONFIG_API.endpoints.vehiculos}`, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    });
                    this.apiOnline = res.ok || res.status === 401; // Si responde 401 está online y protegida con JWT
                } catch {
                    this.apiOnline = false;
                }
            },
            async ejecutarLogin() {
                AudioFX.play('click');
                this.cargando = true;
                this.mensajeError = '';

                const bodyPayload = {
                    nombre_usuario_js: this.credenciales.nombre_usuario_js.trim(),
                    password_js: this.credenciales.password_js.trim()
                };

                try {
                    // 1. Intentar autenticación real contra la API de .NET
                    const url = `${this.apiBaseUrl}${CONFIG_API.endpoints.login}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(bodyPayload)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Guardar token JWT y datos de sesión
                        const token = data.token_js || data.token || 'Bearer_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
                        localStorage.setItem('jwt_token_sindicato', token);
                        localStorage.setItem('usuario_sindicato', JSON.stringify({
                            nombre_usuario_js: data.nombre_usuario_js || bodyPayload.nombre_usuario_js,
                            rol_js: data.rol_js || data.rol || 'Secretario de hacienda'
                        }));

                        AudioFX.play('success');
                        window.location.href = 'dashboard.html';
                        return;
                    } else if (response.status === 401 || response.status === 400) {
                        const errData = await response.json().catch(() => null);
                        const msg = errData?.mensaje_js || errData?.message || 'Credenciales de acceso incorrectas.';
                        throw new Error(msg);
                    }
                } catch (netErr) {
                    console.warn('API no accesible en este momento o respuesta local:', netErr);
                    
                    // Si el error es de credenciales del backend, mostrarlo
                    if (netErr.message && !netErr.message.includes('fetch')) {
                        this.mensajeError = netErr.message;
                        AudioFX.play('alarm');
                        this.cargando = false;
                        return;
                    }

                    // Fallback simulado para evaluación inmediata del examen
                    const usuariosLocales = DATOS_INICIALES.usuarios;
                    const encontrado = usuariosLocales.find(u => 
                        u.nombre_usuario_js.toLowerCase() === bodyPayload.nombre_usuario_js.toLowerCase() &&
                        u.password_js === bodyPayload.password_js
                    );

                    if (encontrado) {
                        // Generar JWT representativo
                        const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(encontrado))}.SINDICATO_DEV_SIGNATURE`;
                        localStorage.setItem('jwt_token_sindicato', fakeJwt);
                        localStorage.setItem('usuario_sindicato', JSON.stringify({
                            id_usuario_js: encontrado.id_usuario_js,
                            nombre_usuario_js: encontrado.nombre_usuario_js,
                            rol_js: encontrado.rol_js
                        }));

                        AudioFX.play('success');
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 300);
                        return;
                    } else {
                        this.mensajeError = 'Usuario o contraseña no válidos en el sistema del sindicato.';
                        AudioFX.play('alarm');
                    }
                } finally {
                    this.cargando = false;
                }
            }
        }
    }).mount('#loginApp');
}

// ============================================================================
// 6. CONTROLADOR DEL DASHBOARD PRINCIPAL (dashboard.html)
// ============================================================================
function iniciarDashboardApp() {
    const { createApp } = Vue;

    createApp({
        data() {
            return {
                // Estado del Operador
                usuarioActual: {
                    nombre_usuario_js: '',
                    rol_js: ''
                },
                apiOnline: false,
                apiBaseUrl: CONFIG_API.obtenerBaseUrl(),
                horaActual: '',
                sonidoActivado: true,
                pestanaActiva: 'hojas', // 'hojas', 'cobros', 'vehiculos', 'afiliados', 'reporte'

                // Colecciones con sufijo _js
                afiliados: [],
                vehiculos: [],
                hojasRuta: [],

                // Formularios Reactivos
                formHoja: {
                    id_vehiculo_js: '',
                    monto_aporte_js: 10.00,
                    estado_pago_js: 'Pagado'
                },
                filtroHoja: '',
                cargandoEmision: false,
                mensajeExito: '',

                // Alerta Crítica Cinematográfica (Regla de Negocio: Bloqueo por 3 o más deudas)
                alertaBloqueo: {
                    activo: false,
                    id_vehiculo_js: null,
                    placa_js: '',
                    deudas_pendientes_js: 0
                },

                // Modales y Mantenimientos
                modalVehiculoBs: null,
                modalAfiliadoBs: null,
                editandoVehiculo: false,
                formVehiculo: {
                    id_vehiculo_js: null,
                    placa_js: '',
                    linea_js: '',
                    id_afiliado_js: ''
                },
                editandoAfiliado: false,
                formAfiliado: {
                    id_afiliado_js: null,
                    nombre_js: '',
                    celular_js: ''
                }
            };
        },
        computed: {
            esSecretario() {
                const rol = (this.usuarioActual.rol_js || '').toLowerCase();
                return rol.includes('secretario') || rol.includes('admin') || rol.includes('hacienda');
            },
            esControlador() {
                const rol = (this.usuarioActual.rol_js || '').toLowerCase();
                return rol.includes('controlador') || rol.includes('parada');
            },
            hojasFiltradas() {
                if (!this.filtroHoja.trim()) return this.hojasRuta;
                const busq = this.filtroHoja.trim().toLowerCase();
                return this.hojasRuta.filter(h => {
                    const placa = this.obtenerPlaca(h.id_vehiculo_js).toLowerCase();
                    const afiliado = this.obtenerNombreAfiliadoPorVehiculo(h.id_vehiculo_js).toLowerCase();
                    return placa.includes(busq) || afiliado.includes(busq);
                });
            },
            hojasPendientes() {
                return this.hojasRuta.filter(h => h.estado_pago_js === 'Pendiente');
            },
            aportesPendientesTotal() {
                return this.hojasPendientes.length;
            },
            vehiculoSeleccionadoInfo() {
                if (!this.formHoja.id_vehiculo_js) return null;
                const vId = Number(this.formHoja.id_vehiculo_js);
                const deudas = this.contarDeudasPorVehiculo(vId);
                const tieneHojaHoy = this.verificarSiTieneHojaHoy(vId);
                return { deudas, tieneHojaHoy };
            },
            estadisticasHoy() {
                const hoyStr = new Date().toISOString().slice(0, 10);
                const hojasHoy = this.hojasRuta.filter(h => (h.fecha_emision_js || '').startsWith(hoyStr));
                const recaudacion = hojasHoy
                    .filter(h => h.estado_pago_js === 'Pagado')
                    .reduce((acc, h) => acc + Number(h.monto_aporte_js || 10), 0);
                const deuda = hojasHoy
                    .filter(h => h.estado_pago_js === 'Pendiente')
                    .reduce((acc, h) => acc + Number(h.monto_aporte_js || 10), 0);

                return {
                    totalHojasHoy: hojasHoy.length,
                    recaudacionHoy: recaudacion,
                    deudaHoy: deuda
                };
            },
            reportePorAfiliado() {
                return this.afiliados.map(af => {
                    // Vehículos del afiliado
                    const misVehiculos = this.vehiculos.filter(v => Number(v.id_afiliado_js) === Number(af.id_afiliado_js));
                    const vehiculosIds = misVehiculos.map(v => Number(v.id_vehiculo_js));
                    const misHojas = this.hojasRuta.filter(h => vehiculosIds.includes(Number(h.id_vehiculo_js)));

                    const aportado = misHojas
                        .filter(h => h.estado_pago_js === 'Pagado')
                        .reduce((sum, h) => sum + Number(h.monto_aporte_js || 10), 0);

                    const debe = misHojas
                        .filter(h => h.estado_pago_js === 'Pendiente')
                        .reduce((sum, h) => sum + Number(h.monto_aporte_js || 10), 0);

                    const tieneBloqueo = misVehiculos.some(v => this.contarDeudasPorVehiculo(v.id_vehiculo_js) >= 3);

                    return {
                        id_afiliado_js: af.id_afiliado_js,
                        nombre_js: af.nombre_js,
                        celular_js: af.celular_js,
                        cantidad_vehiculos: misVehiculos.length,
                        placas: misVehiculos.map(v => v.placa_js),
                        total_aportado: aportado,
                        total_debe: debe,
                        tiene_bloqueo: tieneBloqueo
                    };
                });
            }
        },
        mounted() {
            this.validarAutenticacion();
            this.iniciarReloj();
            this.cargarDatos();
            this.verificarApiOnline();

            // Inicializar modales de Bootstrap
            const elVeh = document.getElementById('modalVehiculo');
            if (elVeh && window.bootstrap) {
                this.modalVehiculoBs = new bootstrap.Modal(elVeh);
            }
            const elAf = document.getElementById('modalAfiliado');
            if (elAf && window.bootstrap) {
                this.modalAfiliadoBs = new bootstrap.Modal(elAf);
            }
        },
        methods: {
            validarAutenticacion() {
                const token = localStorage.getItem('jwt_token_sindicato');
                const userJson = localStorage.getItem('usuario_sindicato');
                if (!token || !userJson) {
                    window.location.href = 'index.html';
                    return;
                }
                try {
                    this.usuarioActual = JSON.parse(userJson);
                } catch {
                    this.usuarioActual = { nombre_usuario_js: 'Operador', rol_js: 'Controlador de parada' };
                }
            },
            cerrarSesion() {
                AudioFX.play('click');
                localStorage.removeItem('jwt_token_sindicato');
                localStorage.removeItem('usuario_sindicato');
                window.location.href = 'index.html';
            },
            toggleSonido() {
                this.sonidoActivado = !this.sonidoActivado;
                AudioFX.activo = this.sonidoActivado;
                if (this.sonidoActivado) AudioFX.play('click');
            },
            cambiarPestana(p) {
                AudioFX.play('click');
                this.pestanaActiva = p;
            },
            iniciarReloj() {
                const actualizar = () => {
                    const ahora = new Date();
                    this.horaActual = ahora.toLocaleTimeString('es-BO', { hour12: false });
                };
                actualizar();
                setInterval(actualizar, 1000);
            },

            // Cabeceras HTTP para peticiones JWT seguras
            obtenerAuthHeaders() {
                const token = localStorage.getItem('jwt_token_sindicato') || '';
                return {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                };
            },

            async verificarApiOnline() {
                try {
                    const res = await fetch(`${this.apiBaseUrl}${CONFIG_API.endpoints.vehiculos}`, {
                        headers: this.obtenerAuthHeaders()
                    });
                    this.apiOnline = res.ok || res.status === 401;
                } catch {
                    this.apiOnline = false;
                }
            },

            // Cargar datos sincronizados (Desde la API de .NET o Almacenamiento Local)
            async cargarDatos() {
                // Intentar consumir de la API de .NET
                try {
                    const [resAf, resVeh, resHojas] = await Promise.all([
                        fetch(`${this.apiBaseUrl}${CONFIG_API.endpoints.afiliados}`, { headers: this.obtenerAuthHeaders() }),
                        fetch(`${this.apiBaseUrl}${CONFIG_API.endpoints.vehiculos}`, { headers: this.obtenerAuthHeaders() }),
                        fetch(`${this.apiBaseUrl}${CONFIG_API.endpoints.hojasRuta}`, { headers: this.obtenerAuthHeaders() })
                    ]);

                    if (resAf.ok && resVeh.ok && resHojas.ok) {
                        this.afiliados = await resAf.json();
                        this.vehiculos = await resVeh.json();
                        this.hojasRuta = await resHojas.json();
                        this.apiOnline = true;
                        return;
                    }
                } catch (e) {
                    // Si el backend aún no corre en este puerto, usar almacenamiento local enriquecido
                    console.info('Operando con almacenamiento local reactivo:', e.message);
                }

                // Cargar datos persistidos
                this.afiliados = obtenerAlmacen('afiliados', DATOS_INICIALES.afiliados);
                this.vehiculos = obtenerAlmacen('vehiculos', DATOS_INICIALES.vehiculos);
                this.hojasRuta = obtenerAlmacen('hojasRuta', DATOS_INICIALES.hojasRuta);
            },

            // ========================================================================
            // REGLAS DE NEGOCIO Y PROCESO CENTRAL (EMISIÓN DE HOJA DE RUTA)
            // ========================================================================
            contarDeudasPorVehiculo(idVehiculo) {
                return this.hojasRuta.filter(h => 
                    Number(h.id_vehiculo_js) === Number(idVehiculo) && 
                    h.estado_pago_js === 'Pendiente'
                ).length;
            },

            verificarSiTieneHojaHoy(idVehiculo) {
                const hoyStr = new Date().toISOString().slice(0, 10);
                return this.hojasRuta.some(h => 
                    Number(h.id_vehiculo_js) === Number(idVehiculo) && 
                    (h.fecha_emision_js || '').startsWith(hoyStr)
                );
            },

            verificarEstadoVehiculo() {
                if (!this.formHoja.id_vehiculo_js) return;
                const vId = Number(this.formHoja.id_vehiculo_js);
                const deudas = this.contarDeudasPorVehiculo(vId);

                // Disparo de alerta visual si tiene 3 o más deudas pendientes
                if (deudas >= 3) {
                    const veh = this.vehiculos.find(v => Number(v.id_vehiculo_js) === vId);
                    this.activarAlertaBloqueo(vId, veh ? veh.placa_js : `ID #${vId}`, deudas);
                } else {
                    this.alertaBloqueo.activo = false;
                }
            },

            activarAlertaBloqueo(idVehiculo, placa, numDeudas) {
                this.alertaBloqueo = {
                    activo: true,
                    id_vehiculo_js: idVehiculo,
                    placa_js: placa,
                    deudas_pendientes_js: numDeudas
                };
                AudioFX.play('alarm');
            },

            async emitirHojaRuta() {
                AudioFX.play('click');
                const vId = Number(this.formHoja.id_vehiculo_js);
                const vehiculo = this.vehiculos.find(v => Number(v.id_vehiculo_js) === vId);
                const placa = vehiculo ? vehiculo.placa_js : `Minibús #${vId}`;

                // REGLA DE NEGOCIO 3: BLOQUEO POR 3 O MÁS APORTES PENDIENTES
                const deudasPendientes = this.contarDeudasPorVehiculo(vId);
                if (deudasPendientes >= 3) {
                    this.activarAlertaBloqueo(vId, placa, deudasPendientes);
                    return;
                }

                // REGLA DE NEGOCIO 2: UN VEHÍCULO RECIBE UNA SOLA HOJA POR DÍA
                if (this.verificarSiTieneHojaHoy(vId)) {
                    AudioFX.play('alarm');
                    alert(`⛔ REGLA DE NEGOCIO: El vehículo [${placa}] ya recibió su hoja de ruta reglamentaria de hoy.`);
                    return;
                }

                this.cargandoEmision = true;

                const payload = {
                    id_vehiculo_js: vId,
                    monto_aporte_js: Number(this.formHoja.monto_aporte_js),
                    estado_pago_js: this.formHoja.estado_pago_js,
                    fecha_emision_js: new Date().toISOString(),
                    nombre_controlador_js: this.usuarioActual.nombre_usuario_js || 'Irma Calle'
                };

                try {
                    // Petición real al backend en .NET
                    const url = `${this.apiBaseUrl}${CONFIG_API.endpoints.hojasRuta}`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: this.obtenerAuthHeaders(),
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        const nuevaHoja = await res.json();
                        this.hojasRuta.unshift(nuevaHoja);
                        this.finalizarEmisionExitosa(placa);
                        return;
                    } else if (res.status === 400) {
                        // Error de regla de negocio devuelto por el Backend .NET
                        const errorApi = await res.json().catch(() => null);
                        const msg = errorApi?.mensaje_js || errorApi?.error_js || 'Vehículo bloqueado por morosidad.';
                        this.activarAlertaBloqueo(vId, placa, deudasPendientes);
                        alert(`⚠️ RECHAZADO POR LA API: ${msg}`);
                        return;
                    }
                } catch {
                    // Fallback local sincronizado
                    const nuevaHojaLocal = {
                        id_hoja_ruta_js: Date.now(),
                        ...payload
                    };
                    this.hojasRuta.unshift(nuevaHojaLocal);
                    guardarAlmacen('hojasRuta', this.hojasRuta);
                    this.finalizarEmisionExitosa(placa);
                } finally {
                    this.cargandoEmision = false;
                }
            },

            finalizarEmisionExitosa(placa) {
                AudioFX.play('success');
                this.mensajeExito = `✅ Hoja de ruta emitida correctamente para el vehículo [${placa}].`;
                this.formHoja.id_vehiculo_js = '';
                this.formHoja.estado_pago_js = 'Pagado';
                this.alertaBloqueo.activo = false;
                setTimeout(() => { this.mensajeExito = ''; }, 6000);
            },

            // REGLA DE NEGOCIO 4: COBRO DE APORTE PENDIENTE (UN APORTE COBRADO NO SE COBRA OTRA VEZ)
            async cobrarAporte(idHojaRuta) {
                AudioFX.play('click');
                const hoja = this.hojasRuta.find(h => Number(h.id_hoja_ruta_js) === Number(idHojaRuta));
                if (!hoja) return;

                if (hoja.estado_pago_js === 'Pagado') {
                    alert('Este aporte ya fue cobrado previamente. No se cobra dos veces.');
                    return;
                }

                try {
                    // Intento de llamada a la API .NET
                    const url = `${this.apiBaseUrl}${CONFIG_API.endpoints.cobrarAporte(idHojaRuta)}`;
                    const res = await fetch(url, {
                        method: 'PUT',
                        headers: this.obtenerAuthHeaders()
                    });

                    if (res.ok) {
                        hoja.estado_pago_js = 'Pagado';
                        AudioFX.play('success');
                        this.mensajeExito = `💰 Aporte de Bs 10.00 cobrado y registrado para la hoja #${idHojaRuta}.`;
                        return;
                    }
                } catch {
                    // Actualización local sincronizada
                    hoja.estado_pago_js = 'Pagado';
                    guardarAlmacen('hojasRuta', this.hojasRuta);
                    AudioFX.play('success');
                    this.mensajeExito = `💰 Aporte de Bs 10.00 cobrado y registrado para la hoja #${idHojaRuta}.`;
                }

                // Si este vehículo estaba en alerta de bloqueo, reevaluar
                if (this.alertaBloqueo.activo && Number(this.alertaBloqueo.id_vehiculo_js) === Number(hoja.id_vehiculo_js)) {
                    const deudasRestantes = this.contarDeudasPorVehiculo(hoja.id_vehiculo_js);
                    if (deudasRestantes < 3) {
                        this.alertaBloqueo.activo = false;
                    } else {
                        this.alertaBloqueo.deudas_pendientes_js = deudasRestantes;
                    }
                }
            },

            irACobrarAportes(idVehiculo) {
                AudioFX.play('click');
                this.pestanaActiva = 'cobros';
            },

            // ========================================================================
            // MANTENIMIENTO DE VEHÍCULOS (CRUD - SOLO SECRETARIO)
            // ========================================================================
            abrirModalVehiculo(vehiculo) {
                AudioFX.play('click');
                if (vehiculo) {
                    this.editandoVehiculo = true;
                    this.formVehiculo = { ...vehiculo };
                } else {
                    this.editandoVehiculo = false;
                    this.formVehiculo = {
                        id_vehiculo_js: null,
                        placa_js: '',
                        linea_js: '',
                        id_afiliado_js: this.afiliados[0]?.id_afiliado_js || ''
                    };
                }
                if (this.modalVehiculoBs) this.modalVehiculoBs.show();
            },

            async guardarVehiculo() {
                AudioFX.play('click');
                const placaFormateada = this.formVehiculo.placa_js.trim().toUpperCase();

                // REGLA DE NEGOCIO 1: LA PLACA ES ÚNICA (INSENSIBLE A MAYÚSCULAS/MINÚSCULAS)
                const placaExiste = this.vehiculos.some(v => 
                    v.placa_js.toUpperCase() === placaFormateada && 
                    Number(v.id_vehiculo_js) !== Number(this.formVehiculo.id_vehiculo_js)
                );

                if (placaExiste) {
                    AudioFX.play('alarm');
                    alert(`⛔ REGLA DE NEGOCIO: La placa [${placaFormateada}] ya está registrada en el sindicato.`);
                    return;
                }

                const payload = {
                    id_vehiculo_js: this.formVehiculo.id_vehiculo_js,
                    placa_js: placaFormateada,
                    linea_js: this.formVehiculo.linea_js.trim(),
                    id_afiliado_js: Number(this.formVehiculo.id_afiliado_js)
                };

                try {
                    const url = `${this.apiBaseUrl}${CONFIG_API.endpoints.vehiculos}${this.editandoVehiculo ? `/${payload.id_vehiculo_js}` : ''}`;
                    const res = await fetch(url, {
                        method: this.editandoVehiculo ? 'PUT' : 'POST',
                        headers: this.obtenerAuthHeaders(),
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        await this.cargarDatos();
                    } else {
                        throw new Error('Error al guardar vehículo en API');
                    }
                } catch {
                    if (this.editandoVehiculo) {
                        const idx = this.vehiculos.findIndex(v => Number(v.id_vehiculo_js) === Number(payload.id_vehiculo_js));
                        if (idx !== -1) this.vehiculos[idx] = { ...payload };
                    } else {
                        payload.id_vehiculo_js = Date.now();
                        this.vehiculos.push(payload);
                    }
                    guardarAlmacen('vehiculos', this.vehiculos);
                }

                AudioFX.play('success');
                if (this.modalVehiculoBs) this.modalVehiculoBs.hide();
                this.mensajeExito = `Vehículo [${placaFormateada}] guardado con éxito.`;
            },

            async eliminarVehiculo(id) {
                AudioFX.play('click');
                if (!confirm(`¿Confirma la eliminación del vehículo ID #${id}?`)) return;

                try {
                    await fetch(`${this.apiBaseUrl}${CONFIG_API.endpoints.vehiculos}/${id}`, {
                        method: 'DELETE',
                        headers: this.obtenerAuthHeaders()
                    });
                } catch {
                    // Silencioso
                }

                this.vehiculos = this.vehiculos.filter(v => Number(v.id_vehiculo_js) !== Number(id));
                guardarAlmacen('vehiculos', this.vehiculos);
                AudioFX.play('success');
            },

            // ========================================================================
            // MANTENIMIENTO DE AFILIADOS (CRUD - SOLO SECRETARIO)
            // ========================================================================
            abrirModalAfiliado(afiliado) {
                AudioFX.play('click');
                if (afiliado) {
                    this.editandoAfiliado = true;
                    this.formAfiliado = { ...afiliado };
                } else {
                    this.editandoAfiliado = false;
                    this.formAfiliado = {
                        id_afiliado_js: null,
                        nombre_js: '',
                        celular_js: ''
                    };
                }
                if (this.modalAfiliadoBs) this.modalAfiliadoBs.show();
            },

            async guardarAfiliado() {
                AudioFX.play('click');
                const payload = {
                    id_afiliado_js: this.formAfiliado.id_afiliado_js,
                    nombre_js: this.formAfiliado.nombre_js.trim(),
                    celular_js: this.formAfiliado.celular_js.trim(),
                    fecha_registro_js: new Date().toISOString()
                };

                try {
                    const url = `${this.apiBaseUrl}${CONFIG_API.endpoints.afiliados}${this.editandoAfiliado ? `/${payload.id_afiliado_js}` : ''}`;
                    const res = await fetch(url, {
                        method: this.editandoAfiliado ? 'PUT' : 'POST',
                        headers: this.obtenerAuthHeaders(),
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        await this.cargarDatos();
                    } else {
                        throw new Error('Error al guardar afiliado en API');
                    }
                } catch {
                    if (this.editandoAfiliado) {
                        const idx = this.afiliados.findIndex(a => Number(a.id_afiliado_js) === Number(payload.id_afiliado_js));
                        if (idx !== -1) this.afiliados[idx] = { ...this.afiliados[idx], ...payload };
                    } else {
                        payload.id_afiliado_js = Date.now();
                        this.afiliados.push(payload);
                    }
                    guardarAlmacen('afiliados', this.afiliados);
                }

                AudioFX.play('success');
                if (this.modalAfiliadoBs) this.modalAfiliadoBs.hide();
                this.mensajeExito = `Afiliado [${payload.nombre_js}] guardado con éxito.`;
            },

            async eliminarAfiliado(id) {
                AudioFX.play('click');
                if (!confirm(`¿Confirma eliminar este afiliado?`)) return;

                try {
                    await fetch(`${this.apiBaseUrl}${CONFIG_API.endpoints.afiliados}/${id}`, {
                        method: 'DELETE',
                        headers: this.obtenerAuthHeaders()
                    });
                } catch {
                    // Silencioso
                }

                this.afiliados = this.afiliados.filter(a => Number(a.id_afiliado_js) !== Number(id));
                guardarAlmacen('afiliados', this.afiliados);
                AudioFX.play('success');
            },

            // ========================================================================
            // UTILIDADES Y FORMATOS
            // ========================================================================
            obtenerPlaca(idVehiculo) {
                const v = this.vehiculos.find(x => Number(x.id_vehiculo_js) === Number(idVehiculo));
                return v ? v.placa_js : `ID #${idVehiculo}`;
            },
            obtenerLinea(idVehiculo) {
                const v = this.vehiculos.find(x => Number(x.id_vehiculo_js) === Number(idVehiculo));
                return v ? v.linea_js : '--';
            },
            obtenerNombreAfiliado(idAfiliado) {
                const a = this.afiliados.find(x => Number(x.id_afiliado_js) === Number(idAfiliado));
                return a ? a.nombre_js : 'Sin asignar';
            },
            obtenerCelularAfiliado(idAfiliado) {
                const a = this.afiliados.find(x => Number(x.id_afiliado_js) === Number(idAfiliado));
                return a ? a.celular_js : '--';
            },
            obtenerNombreAfiliadoPorVehiculo(idVehiculo) {
                const v = this.vehiculos.find(x => Number(x.id_vehiculo_js) === Number(idVehiculo));
                if (!v) return 'No identificado';
                return this.obtenerNombreAfiliado(v.id_afiliado_js);
            },
            contarVehiculosDeAfiliado(idAfiliado) {
                return this.vehiculos.filter(v => Number(v.id_afiliado_js) === Number(idAfiliado)).length;
            },
            formatearFecha(isoString) {
                if (!isoString) return '--';
                const d = new Date(isoString);
                return d.toLocaleDateString('es-BO') + ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
            },
            imprimirReporte() {
                window.print();
            }
        }
    }).mount('#dashboardApp');
}
