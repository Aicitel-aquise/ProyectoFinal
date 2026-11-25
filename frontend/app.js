/**
 * ============================================================================
 * AETHER LAB // SISTEMA DE CONTROL DE PRÉSTAMOS
 * Controlador de Capa de Presentación (Frontend Táctico)
 * ============================================================================
 */

(function () {
    'use strict';

    // Estado Global de la Aplicación
    const state = {
        token: localStorage.getItem('aether_token') || null,
        user: JSON.parse(localStorage.getItem('aether_user') || 'null'),
        currentTab: 'dashboard',
        equipos: [],
        prestamos: [],
        usuarios: [],
        dashboardStats: null,
        cocomoStats: null,
        selectedLoanForReturn: null
    };

    // Sintetizador de Efectos de Sonido Tácticos (Web Audio API)
    const audioSynth = {
        ctx: null,
        init() {
            if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
        },
        play(type = 'click') {
            try {
                this.init();
                if (!this.ctx) return;
                if (this.ctx.state === 'suspended') this.ctx.resume();

                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);

                if (type === 'click') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, now);
                    osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
                    osc.start(now);
                    osc.stop(now + 0.05);
                } else if (type === 'success') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(523.25, now); // C5
                    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
                    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.3);
                } else if (type === 'alert') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(320, now);
                    osc.frequency.setValueAtTime(240, now + 0.1);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
                    osc.start(now);
                    osc.stop(now + 0.25);
                } else if (type === 'return') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.setValueAtTime(880, now + 0.12);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
                    osc.start(now);
                    osc.stop(now + 0.25);
                }
            } catch (e) {
                // Audio no bloqueante
            }
        }
    };

    // ============================================================================
    // SERVICIOS HTTP / CLIENTE DE API REST
    // ============================================================================
    const api = {
        async request(endpoint, options = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            };

            if (state.token) {
                headers['Authorization'] = `Bearer ${state.token}`;
            }

            try {
                const res = await fetch(endpoint, { ...options, headers });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || `Error HTTP ${res.status}`);
                }
                return data;
            } catch (err) {
                console.error(`[API ERROR ${endpoint}]:`, err);
                throw err;
            }
        },

        // Endpoints de Auth
        login: (creds) => api.request('/api/auth/login', { method: 'POST', body: JSON.stringify(creds) }),
        register: (data) => api.request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
        me: () => api.request('/api/auth/me'),

        // Endpoints de Equipos
        getEquipos: (params = '') => api.request(`/api/equipos${params ? '?' + params : ''}`),
        getEquipo: (id) => api.request(`/api/equipos/${id}`),
        createEquipo: (data) => api.request('/api/equipos', { method: 'POST', body: JSON.stringify(data) }),
        updateEquipo: (id, data) => api.request(`/api/equipos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        patchEstadoEquipo: (id, data) => api.request(`/api/equipos/${id}/estado`, { method: 'PATCH', body: JSON.stringify(data) }),
        deleteEquipo: (id) => api.request(`/api/equipos/${id}`, { method: 'DELETE' }),

        // Endpoints de Préstamos
        getPrestamos: (params = '') => api.request(`/api/prestamos${params ? '?' + params : ''}`),
        createPrestamo: (data) => api.request('/api/prestamos', { method: 'POST', body: JSON.stringify(data) }),
        devolverPrestamo: (id, data) => api.request(`/api/prestamos/${id}/devolver`, { method: 'POST', body: JSON.stringify(data) }),

        // Endpoints de Usuarios
        getUsuarios: () => api.request('/api/usuarios'),
        patchRolUsuario: (id, data) => api.request(`/api/usuarios/${id}/rol`, { method: 'PATCH', body: JSON.stringify(data) }),

        // Métricas y COCOMO II
        getDashboardStats: () => api.request('/api/metricas/dashboard'),
        getCocomoStats: () => api.request('/api/metricas/cocomo')
    };

    // ============================================================================
    // SISTEMA DE NOTIFICACIONES TOAST (SCI-FI TACTICAL HUD)
    // ============================================================================
    function showToast(message, type = 'info', title = null) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const defaultTitles = {
            success: 'OPERACIÓN EXITOSA',
            error: 'ALERTA // REGLA VIOLADA',
            warning: 'PRECAUCIÓN TÉCNICA',
            info: 'TELEMETRÍA AETHER'
        };

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: '📡'
        };

        const toast = document.createElement('div');
        toast.className = `tactical-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || '•'}</div>
            <div class="toast-body">
                <div class="toast-title">${title || defaultTitles[type] || 'SISTEMA'}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
        `;

        container.appendChild(toast);
        audioSynth.play(type === 'error' ? 'alert' : type === 'success' ? 'success' : 'click');

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 320);
        }, 4200);
    }

    // ============================================================================
    // UTILIDADES DE FORMATO Y HELPERS
    // ============================================================================
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '--';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    }

    function renderStatusBadge(estado) {
        const config = {
            DISPONIBLE: { cls: 'badge-disponible', label: 'DISPONIBLE' },
            PRESTADO: { cls: 'badge-prestado', label: 'PRESTADO' },
            EN_MANTENIMIENTO: { cls: 'badge-mantenimiento', label: 'MANTENIMIENTO' },
            DANADO: { cls: 'badge-danado', label: 'DAÑADO' },
            DE_BAJA: { cls: 'badge-danado', label: 'DE BAJA' }
        };
        const c = config[estado] || { cls: 'badge-usuario', label: estado };
        return `<span class="badge ${c.cls}"><span class="legend-dot" style="background: currentColor;"></span> ${c.label}</span>`;
    }

    function renderRoleBadge(rol) {
        const config = {
            ADMIN: { cls: 'badge-admin', label: 'ADMIN' },
            ENCARGADO: { cls: 'badge-encargado', label: 'ENCARGADO' },
            OPERADOR: { cls: 'badge-operador', label: 'OPERADOR' },
            USUARIO: { cls: 'badge-usuario', label: 'USUARIO' }
        };
        const c = config[rol] || { cls: 'badge-usuario', label: rol };
        return `<span class="badge ${c.cls}">${c.label}</span>`;
    }

    // ============================================================================
    // MANEJO DE SESIÓN Y CREDENCIALES
    // ============================================================================
    function updateAuthUI() {
        const headerUserLabel = document.getElementById('headerUserLabel');
        const btnAuthAction = document.getElementById('btnAuthAction');
        const btnNuevoEquipo = document.getElementById('btnNuevoEquipo');
        const navTabUsuarios = document.getElementById('navTabUsuarios');
        const navTabAcceso = document.getElementById('navTabAcceso');

        if (state.token && state.user) {
            headerUserLabel.innerHTML = `
                <span class="text-cyan font-bold">${escapeHtml(state.user.nombre)}</span>
                ${renderRoleBadge(state.user.rol)}
            `;
            btnAuthAction.innerHTML = '<span class="btn-icon">🚪</span> CERRAR SESIÓN';
            btnAuthAction.className = 'btn btn-outline-coral btn-sm';

            if (navTabAcceso) {
                navTabAcceso.querySelector('.tab-label').textContent = `SESIÓN: ${state.user.rol}`;
            }

            // Permisos de Administración
            const canManage = ['ADMIN', 'ENCARGADO'].includes(state.user.rol);
            if (btnNuevoEquipo) btnNuevoEquipo.style.display = canManage ? 'inline-flex' : 'none';
            if (navTabUsuarios) navTabUsuarios.style.display = (state.user.rol === 'ADMIN') ? 'flex' : 'none';

            // Si estábamos en la pestaña acceso, pasar a dashboard
            if (state.currentTab === 'acceso') {
                cambiarPestana('dashboard');
            }
        } else {
            headerUserLabel.textContent = 'INVITADO (NO SESIÓN)';
            btnAuthAction.innerHTML = '<span class="btn-icon">🔒</span> INICIAR SESIÓN';
            btnAuthAction.className = 'btn btn-primary-cyan btn-sm';
            if (btnNuevoEquipo) btnNuevoEquipo.style.display = 'none';
            if (navTabUsuarios) navTabUsuarios.style.display = 'none';

            if (navTabAcceso) {
                navTabAcceso.querySelector('.tab-label').textContent = 'ACCESO OPERADOR (LOGIN)';
            }
        }
    }

    function cambiarPestana(targetTab) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        const tabBtn = document.querySelector(`.nav-tab[data-tab="${targetTab}"]`);
        const pane = document.getElementById(`pane-${targetTab}`);

        if (tabBtn) tabBtn.classList.add('active');
        if (pane) pane.classList.add('active');

        state.currentTab = targetTab;
        audioSynth.play('click');

        if (targetTab === 'dashboard') loadDashboard();
        else if (targetTab === 'catalogo') loadCatalog();
        else if (targetTab === 'prestamos') loadLoans();
        else if (targetTab === 'usuarios') loadUsers();
        else if (targetTab === 'cocomo') loadCocomo();
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            audioSynth.play('click');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            audioSynth.play('click');
        }
    }

    // ============================================================================
    // CARGA DE DATOS: DASHBOARD
    // ============================================================================
    async function loadDashboard() {
        try {
            const data = await api.getDashboardStats();
            state.dashboardStats = data;

            // Actualizar contadores KPI
            document.getElementById('kpiTotalEquipos').textContent = data.equipos.total;
            document.getElementById('kpiDisponibles').textContent = data.equipos.disponibles;
            document.getElementById('kpiPrestados').textContent = data.equipos.prestados;
            document.getElementById('kpiMantenimiento').textContent = data.equipos.mantenimiento;
            document.getElementById('kpiDanados').textContent = data.equipos.danados;
            document.getElementById('kpiTasaOperatividad').textContent = `${data.equipos.tasa_operatividad}%`;

            // Actualizar Badge en Navegación
            const badgeCounter = document.getElementById('activeLoansBadge');
            if (badgeCounter) badgeCounter.textContent = data.prestamos.activos;

            // Renderizar Préstamos Activos en la tabla del Dashboard
            const loansRes = await api.getPrestamos('estado=ACTIVO');
            renderDashboardLoansTable(loansRes.prestamos || []);

            // Renderizar Historial de Auditoría
            renderActivityFeed(data.actividad_reciente || []);
        } catch (err) {
            console.error('Error al cargar dashboard:', err);
        }
    }

    function renderDashboardLoansTable(loans) {
        const tbody = document.querySelector('#dashboardActiveLoansTable tbody');
        if (!tbody) return;

        if (loans.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        🛡️ No hay préstamos activos en curso. Todo el instrumental disponible está en depósito.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = loans.map(p => {
            const vencidoCls = p.es_vencido ? 'text-coral font-bold' : 'text-cyan';
            const estadoBadge = p.es_vencido 
                ? '<span class="badge badge-danado">VENCIDO</span>' 
                : '<span class="badge badge-prestado">EN CURSO</span>';

            return `
                <tr>
                    <td class="mono-font text-cyan">${escapeHtml(p.codigo_prestamo || 'PR-ACT')}</td>
                    <td>
                        <div class="font-bold">${escapeHtml(p.equipo_nombre)}</div>
                        <div class="mono-font text-muted font-11">[${escapeHtml(p.equipo_codigo)}]</div>
                    </td>
                    <td>
                        <div>${escapeHtml(p.solicitante_nombre)}</div>
                        <div class="text-muted font-11">${escapeHtml(p.solicitante_departamento || '')}</div>
                    </td>
                    <td class="${vencidoCls} mono-font">${formatDate(p.fecha_limite)}</td>
                    <td>${estadoBadge}</td>
                    <td>
                        <button class="btn btn-outline-emerald btn-xs btn-devolver-act" data-loan-id="${p.id}">
                            📥 DEVOLVER
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Vincular botones de devolución
        tbody.querySelectorAll('.btn-devolver-act').forEach(btn => {
            btn.addEventListener('click', () => {
                const loanId = btn.dataset.loanId;
                const loanObj = loans.find(l => l.id == loanId);
                abrirModalDevolucion(loanObj);
            });
        });
    }

    function renderActivityFeed(activities) {
        const feedContainer = document.getElementById('dashboardActivityFeed');
        if (!feedContainer) return;

        if (activities.length === 0) {
            feedContainer.innerHTML = '<div class="p-3 text-center text-muted">Sin transiciones registradas.</div>';
            return;
        }

        feedContainer.innerHTML = activities.map(a => {
            let icon = '⚡';
            if (a.estado_nuevo === 'DISPONIBLE') icon = '✓';
            else if (a.estado_nuevo === 'PRESTADO') icon = '➔';
            else if (a.estado_nuevo === 'EN_MANTENIMIENTO') icon = '🔧';
            else if (a.estado_nuevo === 'DANADO') icon = '⚠';

            return `
                <div class="feed-item">
                    <div class="feed-icon-wrap">${icon}</div>
                    <div class="feed-content">
                        <div class="feed-header">
                            <span class="feed-equip">${escapeHtml(a.equipo_nombre)}</span>
                            <span class="feed-time">${formatDate(a.fecha)}</span>
                        </div>
                        <div class="mb-1">
                            ${a.estado_anterior ? renderStatusBadge(a.estado_anterior) + ' ➔ ' : ''}
                            ${renderStatusBadge(a.estado_nuevo)}
                        </div>
                        <div class="feed-motivo">${escapeHtml(a.motivo)}</div>
                        <div class="text-muted font-11 mt-1">Por: ${escapeHtml(a.usuario_nombre || 'Sistema')}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================================================================
    // CARGA DE DATOS: CATÁLOGO DE EQUIPOS
    // ============================================================================
    async function loadCatalog() {
        try {
            const q = document.getElementById('catalogSearchInput').value.trim();
            const cat = document.getElementById('catalogCategorySelect').value;
            const est = document.getElementById('catalogStatusSelect').value;

            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (cat !== 'TODAS') params.set('categoria', cat);
            if (est !== 'TODOS') params.set('estado', est);

            const res = await api.getEquipos(params.toString());
            state.equipos = res.equipos || [];

            document.getElementById('catalogResultsCount').textContent = state.equipos.length;
            renderEquipmentGrid(state.equipos);
            populatePrestamoSelect(state.equipos);
        } catch (err) {
            showToast('Error al consultar el catálogo de equipos', 'error');
        }
    }

    function renderEquipmentGrid(equipos) {
        const container = document.getElementById('equipmentCardsContainer');
        if (!container) return;

        if (equipos.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
                    <div class="font-bold text-cyan" style="font-size: 16px;">NO SE ENCONTRARON EQUIPOS</div>
                    <div style="margin-top: 6px;">Prueba ajustando los criterios de búsqueda o filtros de estado.</div>
                </div>
            `;
            return;
        }

        const isAdmin = state.user && ['ADMIN', 'ENCARGADO'].includes(state.user.rol);
        const isSuperAdmin = state.user && state.user.rol === 'ADMIN';

        container.innerHTML = equipos.map(eq => {
            const isDisponible = eq.estado === 'DISPONIBLE';

            let actionButton = '';
            if (isDisponible) {
                actionButton = `
                    <button class="btn btn-primary-cyan btn-sm btn-prestar-card" data-id="${eq.id}">
                        <span class="btn-icon">⚡</span> SOLICITAR PRÉSTAMO
                    </button>
                `;
            } else if (eq.estado === 'PRESTADO') {
                actionButton = `
                    <button class="btn btn-outline-cyan btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">
                        EN USO (PRESTADO)
                    </button>
                `;
            } else if (eq.estado === 'EN_MANTENIMIENTO') {
                actionButton = `
                    <button class="btn btn-outline-amber btn-sm" disabled style="opacity: 0.7; cursor: not-allowed;">
                        EN MANTENIMIENTO
                    </button>
                `;
            } else if (eq.estado === 'DANADO') {
                actionButton = `
                    <button class="btn btn-outline-coral btn-sm" disabled style="opacity: 0.7; cursor: not-allowed;">
                        BLOQUEADO (DAÑADO)
                    </button>
                `;
            }

            const adminTools = isAdmin ? `
                <button class="btn btn-outline-cyan btn-xs btn-override-estado" data-id="${eq.id}" title="Cambiar Estado Administrativo">
                    ⚙️
                </button>
                <button class="btn btn-outline-cyan btn-xs btn-edit-equipo" data-id="${eq.id}" title="Editar Equipo">
                    ✏️
                </button>
                ${isSuperAdmin ? `
                    <button class="btn btn-outline-coral btn-xs btn-delete-equipo" data-id="${eq.id}" data-name="${escapeHtml(eq.nombre)}" title="Eliminar del Catálogo">
                        🗑️
                    </button>
                ` : ''}
            ` : '';

            return `
                <div class="equipment-card">
                    <div>
                        <div class="equip-card-top">
                            <span class="equip-tag">${escapeHtml(eq.codigo)}</span>
                            ${renderStatusBadge(eq.estado)}
                        </div>
                        <h3 class="equip-name">${escapeHtml(eq.nombre)}</h3>
                        <div class="equip-meta">
                            <strong>${escapeHtml(eq.categoria)}</strong> | ${escapeHtml(eq.marca || 'Genérica')} ${escapeHtml(eq.modelo || '')}
                        </div>
                        <div class="equip-specs">
                            ${escapeHtml(eq.especificaciones || eq.descripcion || 'Sin especificaciones registradas.')}
                        </div>
                        <div class="equip-location">
                            <span class="text-cyan">📍</span> ${escapeHtml(eq.ubicacion || 'Laboratorio Central')}
                        </div>
                    </div>

                    <div class="equip-card-actions">
                        <div style="flex-grow: 1;">${actionButton}</div>
                        ${adminTools}
                    </div>
                </div>
            `;
        }).join('');

        // Eventos en tarjetas
        container.querySelectorAll('.btn-prestar-card').forEach(btn => {
            btn.addEventListener('click', () => {
                abrirModalPrestamo(Number(btn.dataset.id));
            });
        });

        container.querySelectorAll('.btn-override-estado').forEach(btn => {
            btn.addEventListener('click', () => {
                abrirModalCambiarEstado(Number(btn.dataset.id));
            });
        });

        container.querySelectorAll('.btn-edit-equipo').forEach(btn => {
            btn.addEventListener('click', () => {
                abrirModalEditarEquipo(Number(btn.dataset.id));
            });
        });

        container.querySelectorAll('.btn-delete-equipo').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmarEliminarEquipo(Number(btn.dataset.id), btn.dataset.name);
            });
        });
    }

    function populatePrestamoSelect(equipos) {
        const select = document.getElementById('prestamoEquipoSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Seleccionar Equipo del Catálogo --</option>';

        equipos.forEach(eq => {
            const isAvailable = eq.estado === 'DISPONIBLE';
            const opt = document.createElement('option');
            opt.value = eq.id;
            opt.textContent = `[${eq.codigo}] ${eq.nombre} — (${eq.estado})`;
            opt.dataset.estado = eq.estado;
            opt.dataset.nombre = eq.nombre;
            opt.dataset.codigo = eq.codigo;
            opt.dataset.ubicacion = eq.ubicacion;

            if (!isAvailable) {
                opt.style.color = '#FF5252';
            }
            select.appendChild(opt);
        });
    }

    // ============================================================================
    // CARGA DE DATOS: PRÉSTAMOS & DEVOLUCIONES
    // ============================================================================
    async function loadLoans(filter = 'TODOS') {
        try {
            const params = filter !== 'TODOS' ? `estado=${filter}` : '';
            const res = await api.getPrestamos(params);
            state.prestamos = res.prestamos || [];
            renderLoansTable(state.prestamos);
        } catch (err) {
            showToast('Error al consultar préstamos', 'error');
        }
    }

    function renderLoansTable(prestamos) {
        const tbody = document.getElementById('allLoansTableBody');
        if (!tbody) return;

        const search = (document.getElementById('loansSearchInput')?.value || '').toLowerCase().trim();

        const filtered = prestamos.filter(p => {
            if (!search) return true;
            return (
                (p.codigo_prestamo && p.codigo_prestamo.toLowerCase().includes(search)) ||
                (p.equipo_nombre && p.equipo_nombre.toLowerCase().includes(search)) ||
                (p.equipo_codigo && p.equipo_codigo.toLowerCase().includes(search)) ||
                (p.solicitante_nombre && p.solicitante_nombre.toLowerCase().includes(search)) ||
                (p.proposito && p.proposito.toLowerCase().includes(search))
            );
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        No se encontraron registros de préstamos con los filtros aplicados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const isActivo = p.estado_prestamo === 'ACTIVO';
            const isVencido = p.es_vencido;

            let estadoBadge = '';
            if (isActivo) {
                estadoBadge = isVencido 
                    ? '<span class="badge badge-danado">VENCIDO</span>' 
                    : '<span class="badge badge-prestado">ACTIVO</span>';
            } else {
                estadoBadge = `<span class="badge badge-disponible">DEVUELTO (${escapeHtml(p.condicion_devolucion || 'OK')})</span>`;
            }

            const actionCell = isActivo ? `
                <button class="btn btn-outline-emerald btn-xs btn-devolver-row" data-loan-id="${p.id}">
                    📥 REGISTRAR DEVOLUCIÓN
                </button>
            ` : `
                <span class="text-muted font-11">Cerrado ${formatDate(p.fecha_devolucion)}</span>
            `;

            return `
                <tr>
                    <td class="mono-font text-cyan font-bold">${escapeHtml(p.codigo_prestamo || '--')}</td>
                    <td>
                        <div class="font-bold">${escapeHtml(p.equipo_nombre)}</div>
                        <div class="mono-font text-muted font-11">[${escapeHtml(p.equipo_codigo)}]</div>
                    </td>
                    <td>
                        <div>${escapeHtml(p.solicitante_nombre)}</div>
                        <div class="text-muted font-11">${escapeHtml(p.solicitante_departamento || '')}</div>
                    </td>
                    <td style="max-width: 220px;">
                        <div class="text-truncate" title="${escapeHtml(p.proposito)}">${escapeHtml(p.proposito)}</div>
                    </td>
                    <td class="mono-font text-muted">${formatDate(p.fecha_prestamo)}</td>
                    <td class="mono-font ${isVencido ? 'text-coral font-bold' : 'text-cyan'}">${formatDate(p.fecha_limite)}</td>
                    <td>${estadoBadge}</td>
                    <td>${actionCell}</td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-devolver-row').forEach(btn => {
            btn.addEventListener('click', () => {
                const loanId = btn.dataset.loanId;
                const loanObj = prestamos.find(l => l.id == loanId);
                abrirModalDevolucion(loanObj);
            });
        });
    }

    // ============================================================================
    // CARGA DE DATOS: OPERADORES & ROLES
    // ============================================================================
    async function loadUsers() {
        if (!state.user || state.user.rol !== 'ADMIN') return;
        try {
            const res = await api.getUsuarios();
            state.usuarios = res.usuarios || [];
            renderUsersTable(state.usuarios);
        } catch (err) {
            showToast('Error al cargar lista de operadores', 'error');
        }
    }

    function renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = users.map(u => {
            const isMe = state.user && state.user.id === u.id;
            const activoBadge = u.activo 
                ? '<span class="badge badge-disponible">HABILITADO</span>' 
                : '<span class="badge badge-danado">DESHABILITADO</span>';

            const roleOptions = ['ADMIN', 'ENCARGADO', 'OPERADOR', 'USUARIO'].map(r => `
                <option value="${r}" ${u.rol === r ? 'selected' : ''}>${r}</option>
            `).join('');

            return `
                <tr>
                    <td class="mono-font text-cyan">#${u.id}</td>
                    <td>
                        <div class="font-bold">${escapeHtml(u.nombre)} ${isMe ? '<span class="badge badge-admin font-10">TÚ</span>' : ''}</div>
                    </td>
                    <td class="mono-font">${escapeHtml(u.email)}</td>
                    <td>
                        <div>${escapeHtml(u.cargo || 'Operador')}</div>
                        <div class="text-muted font-11">${escapeHtml(u.departamento || '')}</div>
                    </td>
                    <td>
                        <select class="role-select" data-user-id="${u.id}" ${isMe ? 'disabled' : ''} style="background: rgba(7, 11, 20, 0.9); border: 1px solid var(--border-subtle); color: var(--text-primary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ${roleOptions}
                        </select>
                    </td>
                    <td>${activoBadge}</td>
                    <td class="mono-font text-muted">${formatDate(u.creado_en)}</td>
                    <td>
                        ${!isMe ? `
                            <button class="btn btn-outline-cyan btn-xs btn-toggle-activo" data-user-id="${u.id}" data-activo="${u.activo ? 0 : 1}">
                                ${u.activo ? 'DESHABILITAR' : 'ACTIVAR'}
                            </button>
                        ` : '<span class="text-muted font-11">Principal</span>'}
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.role-select').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const uid = sel.dataset.userId;
                const newRole = sel.value;
                try {
                    await api.patchRolUsuario(uid, { rol: newRole });
                    showToast(`Rol actualizado a ${newRole}`, 'success');
                    audioSynth.play('success');
                } catch (err) {
                    showToast(err.message, 'error');
                    loadUsers();
                }
            });
        });

        tbody.querySelectorAll('.btn-toggle-activo').forEach(btn => {
            btn.addEventListener('click', async () => {
                const uid = btn.dataset.userId;
                const nuevoActivo = Number(btn.dataset.activo);
                try {
                    await api.patchRolUsuario(uid, { activo: nuevoActivo });
                    showToast(`Estado de usuario actualizado`, 'success');
                    loadUsers();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        });
    }

    // ============================================================================
    // CARGA DE DATOS: ESTIMACIÓN COCOMO II
    // ============================================================================
    async function loadCocomo() {
        try {
            const data = await api.getCocomoStats();
            state.cocomoStats = data;

            // KPIs COCOMO II
            document.getElementById('cocomoSloc').textContent = Number(data.resumen_codigo.lineas_codigo_fuente_sloc).toLocaleString();
            document.getElementById('cocomoKsloc').textContent = `${data.resumen_codigo.ksloc} KLOC`;
            document.getElementById('cocomoPM').textContent = `${data.estimacion_cocomo_ii.esfuerzo_persona_meses_pm} PM`;
            document.getElementById('cocomoTDEV').textContent = `${data.estimacion_cocomo_ii.tiempo_desarrollo_meses_tdev} Meses`;
            document.getElementById('cocomoStaff').textContent = `${data.estimacion_cocomo_ii.personal_estimado_personas} Ingenieros`;

            // Metros de Capas
            const layerContainer = document.getElementById('cocomoLayerMeters');
            if (layerContainer) {
                const totalSloc = data.resumen_codigo.lineas_codigo_fuente_sloc || 1;
                layerContainer.innerHTML = Object.entries(data.capas).map(([key, info]) => {
                    const percent = Math.round((info.sloc / totalSloc) * 100);
                    return `
                        <div class="layer-meter-row">
                            <div class="layer-meter-header">
                                <span class="font-bold">${escapeHtml(info.nombre)}</span>
                                <span class="mono-font text-cyan">${info.sloc} SLOC (${percent}%) // ${info.files} Archivos</span>
                            </div>
                            <div class="layer-progress-bar">
                                <div class="layer-progress-fill" style="width: ${percent}%;"></div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Tabla de Archivos
            const tbody = document.getElementById('cocomoFilesTableBody');
            if (tbody && data.archivos) {
                tbody.innerHTML = data.archivos.map(f => `
                    <tr>
                        <td class="mono-font text-cyan font-bold">${escapeHtml(f.relativePath)}</td>
                        <td><span class="badge badge-usuario">${escapeHtml(f.extension)}</span></td>
                        <td class="mono-font text-emerald font-bold">${f.sloc}</td>
                        <td class="mono-font text-muted">${f.commentLines}</td>
                        <td class="mono-font text-muted">${f.blankLines}</td>
                        <td class="mono-font">${f.totalLines}</td>
                        <td class="mono-font text-muted">${(f.bytes / 1024).toFixed(1)} KB</td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            showToast('Error al inspeccionar métricas COCOMO II', 'error');
        }
    }

    // ============================================================================
    // MODALES Y ACCIONES DE NEGOCIO
    // ============================================================================

    // 1. Modal Préstamo
    function abrirModalPrestamo(equipoId = null) {
        if (!state.token) {
            showToast('Debes iniciar sesión con tu cuenta de operador antes de solicitar un préstamo.', 'warning');
            openModal('modalAuth');
            return;
        }

        const modal = document.getElementById('modalPrestamo');
        const select = document.getElementById('prestamoEquipoSelect');
        const preview = document.getElementById('prestamoEquipoPreview');
        const solicitanteInput = document.getElementById('prestamoSolicitante');
        const deptoInput = document.getElementById('prestamoDepartamento');

        // Valores por defecto del usuario
        solicitanteInput.value = state.user.nombre;
        deptoInput.value = state.user.departamento || 'División I+D & Prototipado';

        // Fecha límite por defecto: +3 días a las 18:00
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        defaultDate.setHours(18, 0, 0, 0);
        document.getElementById('prestamoFechaLimite').value = defaultDate.toISOString().slice(0, 16);

        if (equipoId) {
            select.value = equipoId;
            actualizarPreviewEquipoPrestamo();
        } else {
            select.value = '';
            preview.style.display = 'none';
        }

        openModal('modalPrestamo');
    }

    function actualizarPreviewEquipoPrestamo() {
        const select = document.getElementById('prestamoEquipoSelect');
        const preview = document.getElementById('prestamoEquipoPreview');
        const selectedOpt = select.selectedOptions[0];

        if (!selectedOpt || !selectedOpt.value) {
            preview.style.display = 'none';
            return;
        }

        const estado = selectedOpt.dataset.estado;
        const nombre = selectedOpt.dataset.nombre;
        const codigo = selectedOpt.dataset.codigo;
        const ubicacion = selectedOpt.dataset.ubicacion;

        const isDisponible = estado === 'DISPONIBLE';

        preview.style.display = 'block';
        preview.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="mono-font text-cyan font-bold">[${escapeHtml(codigo)}] ${escapeHtml(nombre)}</span>
                ${renderStatusBadge(estado)}
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
                Ubicación actual: ${escapeHtml(ubicacion || 'Laboratorio Central')}
            </div>
            ${!isDisponible ? `
                <div style="margin-top: 8px; padding: 6px 10px; background: rgba(255, 23, 68, 0.15); border: 1px solid var(--coral-danger); border-radius: 4px; color: var(--coral-danger); font-size: 11px; font-weight: bold;">
                    ⚠️ ATENCIÓN: Este equipo está en estado ${estado}. Las reglas del sistema bloquearán la solicitud si no está DISPONIBLE.
                </div>
            ` : ''}
        `;
    }

    // 2. Modal Devolución
    function abrirModalDevolucion(loan) {
        if (!loan) return;
        state.selectedLoanForReturn = loan;

        document.getElementById('devolucionPrestamoId').value = loan.id;
        const summary = document.getElementById('devolucionSummary');

        summary.innerHTML = `
            <div style="background: rgba(7, 11, 20, 0.7); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span class="mono-font text-cyan font-bold">${escapeHtml(loan.codigo_prestamo)}</span>
                    <span class="badge badge-prestado">PRÉSTAMO ACTIVO</span>
                </div>
                <div class="font-bold text-highlight" style="font-size: 15px;">${escapeHtml(loan.equipo_nombre)}</div>
                <div class="mono-font text-muted font-11 mb-2">[${escapeHtml(loan.equipo_codigo)}]</div>
                <div style="font-size: 12px; color: var(--text-secondary);">
                    <strong>Responsable:</strong> ${escapeHtml(loan.solicitante_nombre)} (${escapeHtml(loan.solicitante_departamento || '')})<br>
                    <strong>Fecha de Préstamo:</strong> ${formatDate(loan.fecha_prestamo)}<br>
                    <strong>Plazo Límite:</strong> ${formatDate(loan.fecha_limite)}
                </div>
            </div>
        `;

        // Restablecer selección a OPERATIVO
        const radioOperativo = document.querySelector('input[name="condicionDevolucion"][value="OPERATIVO"]');
        if (radioOperativo) radioOperativo.checked = true;
        document.getElementById('devolucionObservaciones').value = '';

        openModal('modalDevolucion');
    }

    // 3. Modal Cambiar Estado Administrativo (Admin)
    function abrirModalCambiarEstado(equipoId) {
        const equipo = state.equipos.find(e => e.id === equipoId);
        if (!equipo) return;

        document.getElementById('cambiarEstadoEquipoId').value = equipo.id;
        document.getElementById('cambiarEstadoSelect').value = equipo.estado === 'PRESTADO' ? 'DISPONIBLE' : equipo.estado;
        document.getElementById('cambiarEstadoMotivo').value = '';

        document.getElementById('cambiarEstadoEquipoInfo').innerHTML = `
            <div style="background: rgba(7, 11, 20, 0.7); border: 1px solid var(--border-subtle); padding: 10px; border-radius: 4px;">
                <div class="font-bold">${escapeHtml(equipo.nombre)}</div>
                <div class="mono-font text-cyan font-11">[${escapeHtml(equipo.codigo)}]</div>
                <div class="mt-1">Estado actual: ${renderStatusBadge(equipo.estado)}</div>
            </div>
        `;

        openModal('modalCambiarEstado');
    }

    // 4. Modal Crear / Editar Equipo
    function abrirModalNuevoEquipo() {
        document.getElementById('formEquipo').reset();
        document.getElementById('equipoEditId').value = '';
        document.getElementById('modalEquipoTitle').innerHTML = '<span class="cyan-accent">EQUIPO //</span> INCORPORAR AL INVENTARIO';
        document.getElementById('btnGuardarEquipo').textContent = 'GUARDAR EN INVENTARIO';
        openModal('modalEquipo');
    }

    function abrirModalEditarEquipo(equipoId) {
        const eq = state.equipos.find(e => e.id === equipoId);
        if (!eq) return;

        document.getElementById('equipoEditId').value = eq.id;
        document.getElementById('equipoCodigo').value = eq.codigo;
        document.getElementById('equipoCodigo').disabled = true; // El código no se edita
        document.getElementById('equipoNombre').value = eq.nombre;
        document.getElementById('equipoCategoria').value = eq.categoria;
        document.getElementById('equipoMarca').value = eq.marca || '';
        document.getElementById('equipoModelo').value = eq.modelo || '';
        document.getElementById('equipoNumeroSerie').value = eq.numero_serie || '';
        document.getElementById('equipoUbicacion').value = eq.ubicacion || '';
        document.getElementById('equipoDescripcion').value = eq.descripcion || '';
        document.getElementById('equipoEspecificaciones').value = eq.especificaciones || '';

        document.getElementById('modalEquipoTitle').innerHTML = `<span class="cyan-accent">EQUIPO //</span> EDITAR [${escapeHtml(eq.codigo)}]`;
        document.getElementById('btnGuardarEquipo').textContent = 'ACTUALIZAR DATOS';
        openModal('modalEquipo');
    }

    async function confirmarEliminarEquipo(equipoId, nombre) {
        if (!confirm(`¿Está seguro de eliminar definitivamente el equipo "${nombre}" del catálogo? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await api.deleteEquipo(equipoId);
            showToast(`Equipo "${nombre}" eliminado del inventario`, 'success');
            loadCatalog();
            loadDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // ============================================================================
    // REGISTRO DE EVENTOS DOM
    // ============================================================================
    function setupEventListeners() {
        // Reloj Telemetría
        setInterval(() => {
            const clockEl = document.getElementById('liveClock');
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toTimeString().split(' ')[0];
            }
        }, 1000);

        // Navegación por pestañas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                const pane = document.getElementById(`pane-${targetTab}`);
                if (pane) pane.classList.add('active');

                state.currentTab = targetTab;
                audioSynth.play('click');

                if (targetTab === 'dashboard') loadDashboard();
                else if (targetTab === 'catalogo') loadCatalog();
                else if (targetTab === 'prestamos') loadLoans();
                else if (targetTab === 'usuarios') loadUsers();
                else if (targetTab === 'cocomo') loadCocomo();
            });
        });

        // Botón Ir a Préstamos desde Dashboard
        document.getElementById('btnIrAPrestamos')?.addEventListener('click', () => {
            const tabBtn = document.querySelector('.nav-tab[data-tab="prestamos"]');
            if (tabBtn) tabBtn.click();
        });

        // Toggle Menú Demo Rápida
        const btnQuickDemo = document.getElementById('btnQuickDemoToggle');
        const quickDemoMenu = document.getElementById('quickDemoMenu');
        btnQuickDemo?.addEventListener('click', (e) => {
            e.stopPropagation();
            quickDemoMenu?.classList.toggle('show');
            audioSynth.play('click');
        });

        document.addEventListener('click', () => {
            quickDemoMenu?.classList.remove('show');
        });

        // Selección de Credencial Demo
        document.querySelectorAll('.demo-select-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const email = btn.dataset.email;
                const password = btn.dataset.pass;
                quickDemoMenu?.classList.remove('show');

                try {
                    const res = await api.login({ email, password });
                    state.token = res.token;
                    state.user = res.user;
                    localStorage.setItem('aether_token', res.token);
                    localStorage.setItem('aether_user', JSON.stringify(res.user));

                    updateAuthUI();
                    showToast(res.message, 'success');
                    audioSynth.play('success');

                    // Recargar vistas
                    loadDashboard();
                    loadCatalog();
                    if (state.currentTab === 'usuarios') loadUsers();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        });

        // Botón Login / Logout en Header
        document.getElementById('btnAuthAction')?.addEventListener('click', () => {
            if (state.token) {
                // Cerrar sesión
                state.token = null;
                state.user = null;
                localStorage.removeItem('aether_token');
                localStorage.removeItem('aether_user');
                updateAuthUI();
                showToast('Sesión de operador cerrada correctamente.', 'info');
                audioSynth.play('click');
                loadDashboard();
                loadCatalog();
            } else {
                openModal('modalAuth');
            }
        });

        // Cierre de Modales por botones con data-close-modal
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.closeModal;
                closeModal(target);
            });
        });

        // Tabs dentro del Modal de Autenticación (Login vs Registro)
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

                tab.classList.add('active');
                const mode = tab.dataset.authMode;
                const form = document.getElementById(mode === 'login' ? 'formLogin' : 'formRegister');
                if (form) form.classList.add('active');
                audioSynth.play('click');
            });
        });

        // Envío de Formulario Login
        document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await api.login({ email, password });
                state.token = res.token;
                state.user = res.user;
                localStorage.setItem('aether_token', res.token);
                localStorage.setItem('aether_user', JSON.stringify(res.user));

                updateAuthUI();
                closeModal('modalAuth');
                showToast(res.message, 'success');
                audioSynth.play('success');

                loadDashboard();
                loadCatalog();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

        // Envío de Formulario Registro
        document.getElementById('formRegister')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('regNombre').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const rol = document.getElementById('regRol').value;
            const departamento = document.getElementById('regDepartamento').value.trim();

            try {
                const res = await api.register({ nombre, email, password, rol, departamento });
                state.token = res.token;
                state.user = res.user;
                localStorage.setItem('aether_token', res.token);
                localStorage.setItem('aether_user', JSON.stringify(res.user));

                updateAuthUI();
                closeModal('modalAuth');
                showToast(res.message, 'success');
                audioSynth.play('success');

                loadDashboard();
                loadCatalog();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

        // Búsqueda y Filtros de Catálogo
        const searchInput = document.getElementById('catalogSearchInput');
        const clearSearchBtn = document.getElementById('btnCatalogClearSearch');

        searchInput?.addEventListener('input', () => {
            clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
            loadCatalog();
        });

        clearSearchBtn?.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            loadCatalog();
        });

        document.getElementById('catalogCategorySelect')?.addEventListener('change', loadCatalog);
        document.getElementById('catalogStatusSelect')?.addEventListener('change', loadCatalog);

        // Botón Nuevo Equipo
        document.getElementById('btnNuevoEquipo')?.addEventListener('click', abrirModalNuevoEquipo);

        // Select de Equipo en Modal Préstamo (actualizar preview)
        document.getElementById('prestamoEquipoSelect')?.addEventListener('change', actualizarPreviewEquipoPrestamo);

        // Envío de Formulario Préstamo (REGLAS DE NEGOCIO OBLIGATORIAS)
        document.getElementById('formPrestamo')?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const equipo_id = Number(document.getElementById('prestamoEquipoSelect').value);
            const solicitante_nombre = document.getElementById('prestamoSolicitante').value.trim();
            const solicitante_departamento = document.getElementById('prestamoDepartamento').value.trim();
            const fecha_limite = document.getElementById('prestamoFechaLimite').value;
            const proposito = document.getElementById('prestamoProposito').value.trim();
            const observaciones_prestamo = document.getElementById('prestamoObservaciones').value.trim();

            if (!equipo_id) {
                showToast('Debe seleccionar un equipo del catálogo.', 'warning');
                return;
            }

            try {
                const res = await api.createPrestamo({
                    equipo_id,
                    solicitante_nombre,
                    solicitante_departamento,
                    fecha_limite,
                    proposito,
                    observaciones_prestamo
                });

                closeModal('modalPrestamo');
                showToast(res.message, 'success');
                audioSynth.play('success');

                // Recargar vistas afectadas
                loadDashboard();
                loadCatalog();
                if (state.currentTab === 'prestamos') loadLoans();
            } catch (err) {
                // Alerta explícita si violó regla de negocio
                showToast(err.message, 'error');
            }
        });

        // Botón Registrar Nuevo Préstamo Directo desde la Pestaña 3
        document.getElementById('btnNuevoPrestamoDirecto')?.addEventListener('click', () => {
            abrirModalPrestamo();
        });

        // Filtro por Estado en Pestaña Préstamos (Pills)
        document.querySelectorAll('.filter-pill[data-loan-filter]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill[data-loan-filter]').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const filter = pill.dataset.loanFilter;
                loadLoans(filter);
                audioSynth.play('click');
            });
        });

        document.getElementById('loansSearchInput')?.addEventListener('input', () => {
            renderLoansTable(state.prestamos);
        });

        // Envío de Formulario Devolución (REGLAS DE NEGOCIO OBLIGATORIAS)
        document.getElementById('formDevolucion')?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const prestamoId = document.getElementById('devolucionPrestamoId').value;
            const condicionRadio = document.querySelector('input[name="condicionDevolucion"]:checked');
            const condicion_devolucion = condicionRadio ? condicionRadio.value : 'OPERATIVO';
            const observaciones_devolucion = document.getElementById('devolucionObservaciones').value.trim();

            try {
                const res = await api.devolverPrestamo(prestamoId, {
                    condicion_devolucion,
                    observaciones_devolucion
                });

                closeModal('modalDevolucion');
                showToast(res.message, 'success');
                audioSynth.play('return');

                // Recargar datos
                loadDashboard();
                loadCatalog();
                loadLoans();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

        // Envío de Formulario Crear/Editar Equipo
        document.getElementById('formEquipo')?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const editId = document.getElementById('equipoEditId').value;
            const data = {
                codigo: document.getElementById('equipoCodigo').value.trim(),
                nombre: document.getElementById('equipoNombre').value.trim(),
                categoria: document.getElementById('equipoCategoria').value,
                marca: document.getElementById('equipoMarca').value.trim(),
                modelo: document.getElementById('equipoModelo').value.trim(),
                numero_serie: document.getElementById('equipoNumeroSerie').value.trim(),
                ubicacion: document.getElementById('equipoUbicacion').value.trim(),
                descripcion: document.getElementById('equipoDescripcion').value.trim(),
                especificaciones: document.getElementById('equipoEspecificaciones').value.trim()
            };

            try {
                if (editId) {
                    await api.updateEquipo(editId, data);
                    showToast('Equipo actualizado con éxito', 'success');
                } else {
                    await api.createEquipo(data);
                    showToast('Nuevo equipo registrado en el inventario', 'success');
                }

                closeModal('modalEquipo');
                audioSynth.play('success');
                loadCatalog();
                loadDashboard();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

        // Envío de Formulario Cambiar Estado Administrativo
        document.getElementById('formCambiarEstado')?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const equipoId = document.getElementById('cambiarEstadoEquipoId').value;
            const nuevo_estado = document.getElementById('cambiarEstadoSelect').value;
            const motivo = document.getElementById('cambiarEstadoMotivo').value.trim();

            try {
                const res = await api.patchEstadoEquipo(equipoId, { nuevo_estado, motivo });
                closeModal('modalCambiarEstado');
                showToast(res.message, 'success');
                audioSynth.play('success');

                loadCatalog();
                loadDashboard();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

        // Botón Recalcular COCOMO II
        document.getElementById('btnRefreshCocomo')?.addEventListener('click', () => {
            loadCocomo();
            audioSynth.play('click');
            showToast('Modelo COCOMO II recalculado sobre el árbol de código', 'info');
        });

        // ====================================================================
        // EVENTOS DEL PORTAL DE ACCESO TÁCTICO (LOGIN GATEWAY)
        // ====================================================================
        const btnTabLogin = document.getElementById('btnGatewayTabLogin');
        const btnTabRegister = document.getElementById('btnGatewayTabRegister');
        const paneLogin = document.getElementById('gatewayLoginForm');
        const paneRegister = document.getElementById('gatewayRegisterForm');

        btnTabLogin?.addEventListener('click', () => {
            btnTabLogin.classList.add('active');
            btnTabRegister?.classList.remove('active');
            paneLogin?.classList.add('active');
            paneRegister?.classList.remove('active');
            audioSynth.play('click');
        });

        btnTabRegister?.addEventListener('click', () => {
            btnTabRegister.classList.add('active');
            btnTabLogin?.classList.remove('active');
            paneRegister?.classList.add('active');
            paneLogin?.classList.remove('active');
            audioSynth.play('click');
        });

        // Submit Formulario Login Gateway
        document.getElementById('formGatewayLogin')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('gatewayEmail').value.trim();
            const password = document.getElementById('gatewayPassword').value;

            try {
                const res = await api.login({ email, password });
                state.token = res.token;
                state.user = res.user;
                localStorage.setItem('aether_token', res.token);
                localStorage.setItem('aether_user', JSON.stringify(res.user));

                updateAuthUI();
                showToast(res.message, 'success');
                audioSynth.play('success');

                cambiarPestana('dashboard');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

        // Submit Formulario Registro Gateway
        document.getElementById('formGatewayRegister')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('gwRegNombre').value.trim();
            const email = document.getElementById('gwRegEmail').value.trim();
            const password = document.getElementById('gwRegPassword').value;
            const rol = document.getElementById('gwRegRol').value;
            const departamento = document.getElementById('gwRegDepartamento').value.trim();

            try {
                const res = await api.register({ nombre, email, password, rol, departamento });
                state.token = res.token;
                state.user = res.user;
                localStorage.setItem('aether_token', res.token);
                localStorage.setItem('aether_user', JSON.stringify(res.user));

                updateAuthUI();
                showToast(res.message, 'success');
                audioSynth.play('success');

                cambiarPestana('dashboard');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });

        // Botón Explorar como Invitado
        document.getElementById('btnExplorarInvitado')?.addEventListener('click', () => {
            cambiarPestana('catalogo');
        });
    }

    // Exponer helpers al objeto window para botones onclick inline
    window.aether = {
        async quickLogin(email, password) {
            try {
                const res = await api.login({ email, password });
                state.token = res.token;
                state.user = res.user;
                localStorage.setItem('aether_token', res.token);
                localStorage.setItem('aether_user', JSON.stringify(res.user));

                updateAuthUI();
                showToast(res.message, 'success');
                audioSynth.play('success');

                cambiarPestana('dashboard');
            } catch (err) {
                showToast(err.message, 'error');
            }
        },
        fillDemoCreds(email, password) {
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
            audioSynth.play('click');
        },
        setQuickDeadline(days) {
            const d = new Date();
            d.setDate(d.getDate() + days);
            d.setHours(18, 0, 0, 0);
            const input = document.getElementById('prestamoFechaLimite');
            if (input) input.value = d.toISOString().slice(0, 16);
            audioSynth.play('click');
        }
    };

    // ============================================================================
    // INICIALIZACIÓN
    // ============================================================================
    async function init() {
        console.log('⚡ AETHER LAB // Tactical Console Initializing...');
        updateAuthUI();
        setupEventListeners();

        // Determinar pestaña inicial según si hay sesión activa
        if (state.token && state.user) {
            cambiarPestana('dashboard');
        } else {
            cambiarPestana('acceso');
        }

        // Cargar vista inicial (Dashboard y Catálogo)
        await Promise.all([
            loadDashboard(),
            loadCatalog(),
            loadCocomo()
        ]);
    }

    // Arrancar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
