document.addEventListener('DOMContentLoaded', () => {

    let estado = {
        talleres: [],
        categorias: [],
        instructores: [],
        usuarios: [],
        inscripciones: [],
        usuarioLogueado: null
    };

    const modalLogin = new bootstrap.Modal(document.getElementById('modalLogin'));
    const modalTaller = new bootstrap.Modal(document.getElementById('modalTaller'));
    const modalCategoria = new bootstrap.Modal(document.getElementById('modalCategoria'));
    const modalInstructor = new bootstrap.Modal(document.getElementById('modalInstructor'));
    const modalUsuario = new bootstrap.Modal(document.getElementById('modalUsuario'));
    const modalInscripcion = new bootstrap.Modal(document.getElementById('modalInscripcion'));
    const modalPreinscripcion = new bootstrap.Modal(document.getElementById('modalPreinscripcion'));
    const modalVoucher = new bootstrap.Modal(document.getElementById('modalVoucher'));

    const contenedorTalleres = document.getElementById('contenedor-talleres');
    const filtroBusqueda = document.getElementById('filtro-busqueda');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroDia = document.getElementById('filtro-dia');

    const tabAdmin = document.getElementById('tab-admin');
    const tabPublico = document.getElementById('tab-publico');
    const btnLoginTrigger = document.getElementById('btn-login-trigger');
    const btnLogout = document.getElementById('btn-logout');
    const sessionInfo = document.getElementById('session-info');
    const sessionUsername = document.getElementById('session-username');

    const showToast = (mensaje, tipo = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `custom-toast ${tipo}`;

        let icon = '<i class="fa-solid fa-check-circle text-success me-2"></i>';
        if (tipo === 'error') icon = '<i class="fa-solid fa-circle-exclamation text-danger me-2"></i>';
        if (tipo === 'info') icon = '<i class="fa-solid fa-circle-info text-primary me-2"></i>';

        toast.innerHTML = `
            <div class="d-flex align-items-center">
                ${icon}
                <span>${mensaje}</span>
            </div>
            <button type="button" class="btn-close ms-3 small" style="font-size: 0.75rem;"></button>
        `;

        container.appendChild(toast);
        const closeBtn = toast.querySelector('.btn-close');
        const dismissToast = () => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => { if (toast.parentElement) toast.remove(); }, 300);
            }
        };
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); dismissToast(); });
        setTimeout(dismissToast, 4000);
    };

    let peticionesActivas = 0;
    const restablecerBotonesFormularios = () => {
        document.querySelectorAll('form').forEach(form => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && submitBtn.dataset.originalHtml) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtn.dataset.originalHtml;
                delete submitBtn.dataset.originalHtml;
            }
        });
    };

    const fetchAPI = async (url, options = {}) => {
        peticionesActivas++;
        try {
            const res = await fetch(url, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Ocurrio un error inesperado');
            return data;
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        } finally {
            peticionesActivas--;
            if (peticionesActivas === 0) restablecerBotonesFormularios();
        }
    };

    const verificarSesion = () => {
        const usuarioGuardado = localStorage.getItem('atelier_session');
        if (usuarioGuardado) {
            estado.usuarioLogueado = JSON.parse(usuarioGuardado);
            btnLoginTrigger.classList.add('d-none');
            btnLogout.classList.remove('d-none');
            sessionInfo.classList.remove('d-none');
            sessionUsername.textContent = `${estado.usuarioLogueado.nombre} ${estado.usuarioLogueado.apellido}`;
            if (estado.usuarioLogueado.role === 'admin') {
                tabAdmin.classList.remove('d-none');
                cargarDatosAdmin();
            } else {
                tabAdmin.classList.add('d-none');
                new bootstrap.Tab(tabPublico).show();
            }
        } else {
            estado.usuarioLogueado = null;
            btnLoginTrigger.classList.remove('d-none');
            btnLogout.classList.add('d-none');
            sessionInfo.classList.add('d-none');
            tabAdmin.classList.add('d-none');
            new bootstrap.Tab(tabPublico).show();
        }
    };

    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error-msg');
        try {
            const data = await fetchAPI('/api/usuarios/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            localStorage.setItem('atelier_session', JSON.stringify(data));
            errorMsg.classList.add('d-none');
            modalLogin.hide();
            e.target.reset();
            showToast('Sesion iniciada con exito');
            verificarSesion();
            if (data.role === 'admin') new bootstrap.Tab(tabAdmin).show();
        } catch (err) {
            errorMsg.classList.remove('d-none');
        }
    });

    document.getElementById('form-registro-navbar').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nombre: document.getElementById('reg-nombre').value.trim(),
            apellido: document.getElementById('reg-apellido').value.trim(),
            correo: document.getElementById('reg-correo').value.trim(),
            username: document.getElementById('reg-username').value.trim(),
            password: document.getElementById('reg-password').value
        };
        try {
            const nuevoUser = await fetchAPI('/api/usuarios', { method: 'POST', body: JSON.stringify(payload) });
            guardarSesion(nuevoUser);
            modalLogin.hide();
            e.target.reset();
            showToast('Cuenta creada con éxito e inicio de sesión automático.', 'success');
            verificarSesion();
        } catch (err) {}
    });

    document.getElementById('modalLogin').addEventListener('hidden.bs.modal', () => {
        document.getElementById('form-login').reset();
        document.getElementById('form-registro-navbar').reset();
        document.getElementById('login-error-msg').classList.add('d-none');
        const firstTab = document.querySelector('#tab-acceder-link');
        if (firstTab) {
            const tabInstance = bootstrap.Tab.getInstance(firstTab) || new bootstrap.Tab(firstTab);
            tabInstance.show();
        }
    });

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('atelier_session');
        showToast('Sesion cerrada correctamente.', 'info');
        verificarSesion();
    });

    const cargarCatalogos = async () => {
        try {
            estado.categorias = await fetchAPI('/api/categorias');
            estado.instructores = await fetchAPI('/api/instructores');
            filtroCategoria.innerHTML = '<option value="">Todas las categorias</option>' +
                estado.categorias.map(c => `<option value="${c.id}">${c.nombre_categoria}</option>`).join('');
            await cargarTalleres();
        } catch (err) {
            console.error('Error al inicializar catalogos:', err);
        }
    };

    const cargarTalleres = async () => {
        try {
            estado.talleres = await fetchAPI('/api/talleres');
            let inscripciones = [];
            try {
                inscripciones = await fetch('/api/inscripciones').then(r => r.json());
            } catch (e) { }
            renderizarTalleresPublicos(inscripciones);
            if (estado.usuarioLogueado && estado.usuarioLogueado.role === 'admin') {
                renderizarTalleresAdmin(inscripciones);
            }
        } catch (err) {
            contenedorTalleres.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">Error al conectar con el servidor.</p></div>';
        }
    };

    const cargarDatosAdmin = async () => {
        try {
            await cargarCatalogos();
            estado.usuarios = await fetchAPI('/api/usuarios');
            estado.inscripciones = await fetchAPI('/api/inscripciones');
            renderizarCategoriasAdmin();
            renderizarInstructoresAdmin();
            renderizarUsuariosAdmin();
            renderizarInscripcionesAdmin();
        } catch (err) {
            console.error('Error cargando administracion:', err);
        }
    };

    const formatearHorarios = (horarios = []) => {
        if (!horarios || horarios.length === 0) return 'Sin horario';
        return horarios.map(h => `${h.dia_semana} ${h.hora.substring(0, 5)}`).join(' / ');
    };

    const renderizarTalleresPublicos = (inscripciones = []) => {
        const texto = filtroBusqueda.value.toLowerCase().trim();
        const categoriaId = filtroCategoria.value;
        const dia = filtroDia.value;

        const filtrados = estado.talleres.filter(t => {
            const matchesTexto = t.nombre_taller.toLowerCase().includes(texto) || t.descripcion.toLowerCase().includes(texto);
            const matchesCategoria = !categoriaId || t.id_categoria == categoriaId;
            const matchesDia = !dia || (t.horarios && t.horarios.some(h => h.dia_semana === dia));
            return matchesTexto && matchesCategoria && matchesDia;
        });

        if (filtrados.length === 0) {
            contenedorTalleres.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fa-solid fa-face-frown text-muted fs-1 mb-2"></i>
                    <p class="text-muted">No se encontraron talleres con los filtros seleccionados.</p>
                </div>
            `;
            return;
        }

        contenedorTalleres.innerHTML = filtrados.map(taller => {
            const cat = estado.categorias.find(c => c.id === taller.id_categoria);
            const inst = estado.instructores.find(i => i.id === taller.id_instructor);
            const ocupados = inscripciones.filter(ins => ins.id_taller === taller.id).length;
            const libres = Math.max(0, taller.cupos - ocupados);
            const catNombre = cat ? cat.nombre_categoria : 'Sin Categoria';
            const instNombre = inst ? `${inst.nombre} ${inst.apellido}` : 'Sin Instructor';

            const badgeCupos = libres > 0
                ? `<span class="card-meta-pill accent-pill"><i class="fa-solid fa-circle-check me-1"></i> ${libres} disponibles</span>`
                : `<span class="card-meta-pill danger-pill"><i class="fa-solid fa-circle-xmark me-1"></i> Agotado</span>`;

            const btnInscripcion = libres > 0
                ? `<button class="btn btn-primary-custom w-100 mt-3" onclick="abrirPreinscripcion(${taller.id})"><i class="fa-solid fa-file-pen me-2"></i>Inscribirme</button>`
                : `<button class="btn btn-secondary w-100 mt-3" disabled><i class="fa-solid fa-ban me-2"></i>Sin Cupos</button>`;

            const horariosHtml = taller.horarios && taller.horarios.length > 0
                ? taller.horarios.map(h => `<span class="me-2"><i class="fa-regular fa-calendar me-1"></i>${h.dia_semana} ${h.hora.substring(0,5)}</span>`).join('')
                : '<span class="text-muted">Sin horario definido</span>';

            return `
                <div class="col-md-6 col-lg-4">
                    <div class="card-custom h-100 d-flex flex-column justify-content-between">
                        <div class="card-custom-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-dark text-white rounded-pill px-2.5 py-1.5 fs-7">${catNombre}</span>
                                ${badgeCupos}
                            </div>
                            <h5 class="card-custom-title">${taller.nombre_taller}</h5>
                            <p class="text-muted small mb-3 flex-grow-1">${taller.descripcion}</p>
                            <hr class="my-2 border-slate-100">
                            <div class="small text-secondary mb-1">
                                <i class="fa-solid fa-user-tie me-2 text-indigo"></i><strong>Instructor:</strong> ${instNombre}
                            </div>
                            <div class="small text-secondary mb-1">
                                <i class="fa-solid fa-calendar-day me-2 text-indigo"></i><strong>Horarios:</strong><br>
                                <span class="ms-3">${horariosHtml}</span>
                            </div>
                            <div class="small text-secondary">
                                <i class="fa-solid fa-users-viewfinder me-2 text-indigo"></i><strong>Capacidad total:</strong> ${taller.cupos} alumnos
                            </div>
                        </div>
                        <div class="px-4 pb-4 mt-auto">
                            ${btnInscripcion}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderizarTalleresAdmin = (inscripciones = []) => {
        const tbody = document.getElementById('tabla-talleres-body');
        if (estado.talleres.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No hay talleres registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = estado.talleres.map(t => {
            const cat = estado.categorias.find(c => c.id === t.id_categoria);
            const inst = estado.instructores.find(i => i.id === t.id_instructor);
            const ocupados = inscripciones.filter(ins => ins.id_taller === t.id).length;

            return `
                <tr>
                    <td><strong>${t.id}</strong></td>
                    <td>${t.nombre_taller}</td>
                    <td><span class="badge bg-light text-dark">${cat ? cat.nombre_categoria : 'N/A'}</span></td>
                    <td>${inst ? `${inst.nombre} ${inst.apellido}` : 'N/A'}</td>
                    <td class="small">${formatearHorarios(t.horarios)}</td>
                    <td><strong class="text-primary">${ocupados}</strong> / ${t.cupos}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-secondary btn-sm btn-icon-only me-1" title="Exportar alumnos PDF" onclick="exportarAlumnosPDF(${t.id})">
                            <i class="fa-solid fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-outline-dark btn-sm btn-icon-only me-1" onclick="prepararEditarTaller(${t.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm btn-icon-only" onclick="eliminarTaller(${t.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const renderizarCategoriasAdmin = () => {
        const tbody = document.getElementById('tabla-categorias-body');
        if (estado.categorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4">No hay categorias registradas.</td></tr>';
            return;
        }
        tbody.innerHTML = estado.categorias.map(c => `
            <tr>
                <td><strong>${c.id}</strong></td>
                <td>${c.nombre_categoria}</td>
                <td class="text-end">
                    <button class="btn btn-outline-dark btn-sm btn-icon-only me-1" onclick="prepararEditarCategoria(${c.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm btn-icon-only" onclick="eliminarCategoria(${c.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };

    const renderizarInstructoresAdmin = () => {
        const tbody = document.getElementById('tabla-instructores-body');
        if (estado.instructores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No hay instructores registrados.</td></tr>';
            return;
        }
        tbody.innerHTML = estado.instructores.map(i => {
            const cat = estado.categorias.find(c => c.id === i.id_categoria);
            return `
                <tr>
                    <td><strong>${i.id}</strong></td>
                    <td>${i.nombre} ${i.apellido}</td>
                    <td><span class="badge bg-light text-dark">${cat ? cat.nombre_categoria : 'Ninguna'}</span></td>
                    <td class="text-end">
                        <button class="btn btn-outline-dark btn-sm btn-icon-only me-1" onclick="prepararEditarInstructor(${i.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm btn-icon-only" onclick="eliminarInstructor(${i.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const renderizarUsuariosAdmin = () => {
        const tbody = document.getElementById('tabla-usuarios-body');
        if (estado.usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay usuarios registrados.</td></tr>';
            return;
        }
        tbody.innerHTML = estado.usuarios.map(u => `
            <tr>
                <td><strong>${u.id}</strong></td>
                <td>${u.nombre} ${u.apellido}</td>
                <td>${u.correo}</td>
                <td><code class="text-indigo">${u.username}</code></td>
                <td class="text-end">
                    <button class="btn btn-outline-dark btn-sm btn-icon-only me-1" onclick="prepararEditarUsuario(${u.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    ${u.role === 'admin' ? '' : `<button class="btn btn-outline-danger btn-sm btn-icon-only" onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button>`}
                </td>
            </tr>
        `).join('');
    };

    const renderizarInscripcionesAdmin = () => {
        const tbody = document.getElementById('tabla-inscripciones-body');
        if (estado.inscripciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay inscripciones registradas.</td></tr>';
            return;
        }
        tbody.innerHTML = estado.inscripciones.map(ins => {
            const user = estado.usuarios.find(u => u.id === ins.id_usuario);
            const taller = estado.talleres.find(t => t.id === ins.id_taller);
            const fecha = new Date(ins.fecha_inscripcion).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            return `
                <tr>
                    <td><strong>${ins.id}</strong></td>
                    <td>${user ? `${user.nombre} ${user.apellido}` : `<span class="text-muted">ID: ${ins.id_usuario} (Eliminado)</span>`}</td>
                    <td>${taller ? taller.nombre_taller : `<span class="text-muted">ID: ${ins.id_taller} (Eliminado)</span>`}</td>
                    <td>${fecha}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminarInscripcion(${ins.id})">
                            <i class="fa-solid fa-user-minus"></i> Cancelar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const actualizarSelectsModales = () => {
        const selCatTaller = document.getElementById('taller-categoria');
        const selInstTaller = document.getElementById('taller-instructor');
        const selCatInst = document.getElementById('instructor-categoria');
        const selUserIns = document.getElementById('inscripcion-usuario');
        const selTallerIns = document.getElementById('inscripcion-taller');

        const optCategorias = '<option value="">Seleccione una categoria</option>' +
            estado.categorias.map(c => `<option value="${c.id}">${c.nombre_categoria}</option>`).join('');
        const optInstructores = '<option value="">Seleccione un instructor</option>' +
            estado.instructores.map(i => `<option value="${i.id}">${i.nombre} ${i.apellido}</option>`).join('');
        const optUsuarios = '<option value="">Seleccione un alumno</option>' +
            estado.usuarios.map(u => `<option value="${u.id}">${u.nombre} ${u.apellido} (${u.username})</option>`).join('');
        const optTalleres = '<option value="">Seleccione un taller</option>' +
            estado.talleres.map(t => `<option value="${t.id}">${t.nombre_taller}</option>`).join('');

        selCatTaller.innerHTML = optCategorias;
        selCatInst.innerHTML = optCategorias;
        selInstTaller.innerHTML = optInstructores;
        selUserIns.innerHTML = optUsuarios;
        selTallerIns.innerHTML = optTalleres;
    };

    window.agregarFilaHorario = (dia = 'Lunes', hook = '') => {
        const contenedor = document.getElementById('contenedor-horarios');
        const div = document.createElement('div');
        div.className = 'd-flex gap-2 mb-2 align-items-center fila-horario';
        div.innerHTML = `
            <select class="form-select form-control-custom horario-dia">
                <option value="Lunes" ${dia === 'Lunes' ? 'selected' : ''}>Lunes</option>
                <option value="Martes" ${dia === 'Martes' ? 'selected' : ''}>Martes</option>
                <option value="Miercoles" ${dia === 'Miercoles' ? 'selected' : ''}>Miercoles</option>
                <option value="Jueves" ${dia === 'Jueves' ? 'selected' : ''}>Jueves</option>
                <option value="Viernes" ${dia === 'Viernes' ? 'selected' : ''}>Viernes</option>
                <option value="Sabado" ${dia === 'Sabado' ? 'selected' : ''}>Sabado</option>
            </select>
            <input type="time" class="form-control form-control-custom horario-hora" value="${hook}">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        contenedor.appendChild(div);
    };

    const leerHorariosDelForm = () => {
        const filas = document.querySelectorAll('.fila-horario');
        const horarios = [];
        filas.forEach(fila => {
            const dia = fila.querySelector('.horario-dia').value;
            const hora = fila.querySelector('.horario-hora').value;
            if (dia && hora) horarios.push({ dia_semana: dia, hora });
        });
        return horarios;
    };

    window.prepararCrearTaller = () => {
        actualizarSelectsModales();
        document.getElementById('form-taller').reset();
        document.getElementById('taller-id').value = '';
        document.getElementById('modalTaller-titulo').textContent = 'Nuevo Taller';
        document.getElementById('contenedor-horarios').innerHTML = '';
        window.agregarFilaHorario();
    };

    window.prepararEditarTaller = (id) => {
        actualizarSelectsModales();
        const t = estado.talleres.find(t => t.id === id);
        if (!t) return;
        document.getElementById('taller-id').value = t.id;
        document.getElementById('taller-nombre').value = t.nombre_taller;
        document.getElementById('taller-categoria').value = t.id_categoria || '';
        document.getElementById('taller-instructor').value = t.id_instructor || '';
        document.getElementById('taller-cupos').value = t.cupos;
        document.getElementById('taller-descripcion').value = t.descripcion;
        document.getElementById('modalTaller-titulo').textContent = 'Editar Taller';

        document.getElementById('contenedor-horarios').innerHTML = '';
        if (t.horarios && t.horarios.length > 0) {
            t.horarios.forEach(h => window.agregarFilaHorario(h.dia_semana, h.hora.substring(0, 5)));
        } else {
            window.agregarFilaHorario();
        }

        modalTaller.show();
    };

    window.prepararCrearCategoria = () => {
        document.getElementById('form-categoria').reset();
        document.getElementById('categoria-id').value = '';
        document.getElementById('modalCategoria-titulo').textContent = 'Nueva Categoria';
    };
    window.prepararEditarCategoria = (id) => {
        const c = estado.categorias.find(cat => cat.id === id);
        if (!c) return;
        document.getElementById('categoria-id').value = c.id;
        document.getElementById('categoria-nombre').value = c.nombre_categoria;
        document.getElementById('modalCategoria-titulo').textContent = 'Editar Categoria';
        modalCategoria.show();
    };

    window.prepararCrearInstructor = () => {
        actualizarSelectsModales();
        document.getElementById('form-instructor').reset();
        document.getElementById('instructor-id').value = '';
        document.getElementById('modalInstructor-titulo').textContent = 'Nuevo Instructor';
    };
    window.prepararEditarInstructor = (id) => {
        actualizarSelectsModales();
        const inst = estado.instructores.find(i => i.id === id);
        if (!inst) return;
        document.getElementById('instructor-id').value = inst.id;
        document.getElementById('instructor-nombre').value = inst.nombre;
        document.getElementById('instructor-apellido').value = inst.apellido;
        document.getElementById('instructor-categoria').value = inst.id_categoria || '';
        document.getElementById('modalInstructor-titulo').textContent = 'Editar Instructor';
        modalInstructor.show();
    };

    window.prepararCrearUsuario = () => {
        document.getElementById('form-usuario').reset();
        document.getElementById('usuario-id').value = '';
        document.getElementById('usuario-password').required = true;
        document.getElementById('modalUsuario-titulo').textContent = 'Nuevo Usuario / Alumno';
    };
    window.prepararEditarUsuario = (id) => {
        const u = estado.usuarios.find(user => user.id === id);
        if (!u) return;
        document.getElementById('usuario-id').value = u.id;
        document.getElementById('usuario-nombre').value = u.nombre;
        document.getElementById('usuario-apellido').value = u.apellido;
        document.getElementById('usuario-correo').value = u.correo;
        document.getElementById('usuario-username').value = u.username;
        document.getElementById('usuario-password').value = '';
        document.getElementById('usuario-password').required = false;
        document.getElementById('modalUsuario-titulo').textContent = 'Editar Usuario';
        modalUsuario.show();
    };

    window.prepararCrearInscripcion = () => {
        actualizarSelectsModales();
        document.getElementById('form-inscripcion').reset();
    };

    window.abrirPreinscripcion = (tallerId) => {
        const t = estado.talleres.find(taller => taller.id === tallerId);
        if (!t) return;

        if (estado.usuarioLogueado) {
            if (confirm(`¿Deseas inscribirte en el taller "${t.nombre_taller}"?`)) {
                inscribirYMostrarVoucher(estado.usuarioLogueado.id, t.id);
            }
        } else {
            document.getElementById('preinscripcion-taller-id').value = t.id;
            document.getElementById('preinscripcion-taller-nombre').textContent = t.nombre_taller;
            document.getElementById('preinscripcion-taller-horarios').innerHTML =
                t.horarios && t.horarios.length > 0
                    ? t.horarios.map(h => `<i class="fa-regular fa-calendar me-1"></i>${h.dia_semana} ${h.hora.substring(0,5)}`).join('&nbsp;&nbsp;')
                    : 'Sin horario';

            volverPaso1();
            modalPreinscripcion.show();
        }
    };

    window.volverPaso1 = () => {
        document.getElementById('paso-1').classList.remove('d-none');
        document.getElementById('paso-2-nuevo').classList.add('d-none');
        document.getElementById('paso-2-existente').classList.add('d-none');
        document.getElementById('pre-correo').value = '';
        document.getElementById('pre-error-login').classList.add('d-none');
    };

    window.verificarCorreoPreinscripcion = async () => {
        const correo = document.getElementById('pre-correo').value.trim();
        if (!correo) { showToast('Ingresa un correo valido', 'error'); return; }

        try {
            const resp = await fetchAPI(`/api/usuarios/verificar?correo=${encodeURIComponent(correo)}`);
            document.getElementById('paso-1').classList.add('d-none');

            if (resp.existe) {
                document.getElementById('pre-nombre-existente').textContent = resp.nombre;
                document.getElementById('pre-password-existente').value = '';
                document.getElementById('paso-2-existente').classList.remove('d-none');
            } else {
                document.getElementById('paso-2-nuevo').classList.remove('d-none');
            }
        } catch (e) {}
    };

    window.confirmarInscripcionNuevo = async () => {
        const id_taller = parseInt(document.getElementById('preinscripcion-taller-id').value);
        const correo = document.getElementById('pre-correo').value.trim();
        const payload = {
            nombre: document.getElementById('pre-nombre').value.trim(),
            apellido: document.getElementById('pre-apellido').value.trim(),
            correo: correo,
            username: document.getElementById('pre-username').value.trim(),
            password: document.getElementById('pre-password-nuevo').value
        };

        if (!payload.nombre || !payload.apellido || !payload.username || !payload.password) {
            showToast('Completa todos los campos', 'error');
            return;
        }

        try {
            const nuevoUser = await fetchAPI('/api/usuarios', { method: 'POST', body: JSON.stringify(payload) });
            guardarSesion(nuevoUser);
            await inscribirYMostrarVoucher(nuevoUser.id, id_taller, true);
        } catch (e) {}
    };

    window.confirmarInscripcionExistente = async () => {
        const id_taller = parseInt(document.getElementById('preinscripcion-taller-id').value);
        const correo = document.getElementById('pre-correo').value.trim();
        const password = document.getElementById('pre-password-existente').value;
        const errorDiv = document.getElementById('pre-error-login');

        try {
            const verificacion = await fetchAPI(`/api/usuarios/verificar?correo=${encodeURIComponent(correo)}`);
            const loginResult = await fetchAPI('/api/usuarios/login', {
                method: 'POST',
                body: JSON.stringify({ username: verificacion.username, password })
            });
            errorDiv.classList.add('d-none');
            guardarSesion(loginResult);
            await inscribirYMostrarVoucher(loginResult.id, id_taller, true);
        } catch (e) {
            errorDiv.classList.remove('d-none');
        }
    };

    const guardarSesion = (userData) => {
        localStorage.setItem('atelier_session', JSON.stringify({
            id: userData.id,
            nombre: userData.nombre,
            apellido: userData.apellido,
            correo: userData.correo,
            username: userData.username,
            role: userData.role || 'alumno'
        }));
        estado.usuarioLogueado = JSON.parse(localStorage.getItem('atelier_session'));
    };

    const inscribirYMostrarVoucher = async (idUsuario, idTaller, cerrarModalPrevio = false) => {
        try {
            await fetchAPI('/api/inscripciones', {
                method: 'POST',
                body: JSON.stringify({ id_usuario: idUsuario, id_taller: idTaller })
            });

            if (cerrarModalPrevio) modalPreinscripcion.hide();

            showToast('Te has inscrito correctamente en el taller.', 'success');
            verificarSesion();
            await cargarTalleres();

            mostrarVoucher(idUsuario, idTaller);
        } catch (e) {}
    };

    window.mostrarVoucher = (idUsuario, idTaller) => {
        const taller = estado.talleres.find(t => t.id === idTaller);
        const usuario = estado.usuarioLogueado;

        document.getElementById('voucher-alumno').textContent = usuario ? `${usuario.nombre} ${usuario.apellido}` : '';
        document.getElementById('voucher-correo').textContent = usuario ? usuario.correo : '';
        document.getElementById('voucher-taller').textContent = taller ? taller.nombre_taller : '';
        document.getElementById('voucher-horarios').textContent = taller ? formatearHorarios(taller.horarios) : '';
        document.getElementById('voucher-fecha').textContent = new Date().toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        setTimeout(() => modalVoucher.show(), 300);
    };

    window.descargarVoucherPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Atelier - Comprobante de Inscripcion', 20, 25);
        doc.setFontSize(12);
        doc.text(`Alumno: ${document.getElementById('voucher-alumno').textContent}`, 20, 45);
        doc.text(`Correo: ${document.getElementById('voucher-correo').textContent}`, 20, 55);
        doc.text(`Taller: ${document.getElementById('voucher-taller').textContent}`, 20, 65);
        doc.text(`Horarios: ${document.getElementById('voucher-horarios').textContent}`, 20, 75);
        doc.text(`Fecha de inscripcion: ${document.getElementById('voucher-fecha').textContent}`, 20, 85);
        doc.setFontSize(10);
        doc.text('Guarda este comprobante para tus registros.', 20, 105);

        doc.save('voucher-inscripcion.pdf');
    };

    window.exportarAlumnosPDF = async (idTaller) => {
        const taller = estado.talleres.find(t => t.id === idTaller);
        try {
            const alumnos = await fetchAPI(`/api/inscripciones/taller/${idTaller}`);

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text(`Alumnos inscritos - ${taller ? taller.nombre_taller : 'Taller'}`, 14, 20);
            doc.setFontSize(10);
            doc.text(`Horarios: ${taller ? formatearHorarios(taller.horarios) : ''}`, 14, 28);
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 34);

            if (alumnos.length === 0) {
                doc.setFontSize(12);
                doc.text('No hay alumnos inscritos en este taller.', 14, 50);
            } else {
                const filas = alumnos.map((a, i) => [
                    i + 1,
                    `${a.nombre} ${a.apellido}`,
                    a.correo,
                    a.username,
                    new Date(a.fecha_inscripcion).toLocaleDateString('es-ES')
                ]);

                doc.autoTable({
                    startY: 42,
                    head: [['#', 'Nombre', 'Correo', 'Usuario', 'Fecha Inscripcion']],
                    body: filas,
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [41, 74, 60] }
                });
            }

            doc.save(`alumnos-${taller ? taller.nombre_taller.replace(/ /g, '-') : 'taller'}.pdf`);
            showToast('PDF exportado correctamente.', 'success');
        } catch (e) {}
    };

    document.getElementById('form-taller').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('taller-id').value;
        const horarios = leerHorariosDelForm();

        if (horarios.length === 0) {
            showToast('Agrega al menos un horario al taller', 'error');
            return;
        }

        const payload = {
            nombre_taller: document.getElementById('taller-nombre').value,
            id_categoria: parseInt(document.getElementById('taller-categoria').value),
            id_instructor: parseInt(document.getElementById('taller-instructor').value),
            cupos: parseInt(document.getElementById('taller-cupos').value),
            descripcion: document.getElementById('taller-descripcion').value,
            horarios: horarios
        };

        const url = id ? `/api/talleres/${id}` : '/api/talleres';
        const method = id ? 'PUT' : 'POST';

        try {
            await fetchAPI(url, { method, body: JSON.stringify(payload) });
            modalTaller.hide();
            showToast(id ? 'Taller actualizado correctamente.' : 'Taller creado correctamente.');
            await cargarTalleres();
        } catch (e) {}
    });

    document.getElementById('form-categoria').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('categoria-id').value;
        const payload = { nombre_categoria: document.getElementById('categoria-nombre').value };
        const url = id ? `/api/categorias/${id}` : '/api/categorias';
        const method = id ? 'PUT' : 'POST';
        try {
            await fetchAPI(url, { method, body: JSON.stringify(payload) });
            modalCategoria.hide();
            showToast(id ? 'Categoria actualizada correctamente.' : 'Categoria creada correctamente.');
            await cargarDatosAdmin();
        } catch (e) {}
    });

    document.getElementById('form-instructor').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('instructor-id').value;
        const payload = {
            nombre: document.getElementById('instructor-nombre').value,
            apellido: document.getElementById('instructor-apellido').value,
            id_categoria: parseInt(document.getElementById('instructor-categoria').value) || null
        };
        const url = id ? `/api/instructores/${id}` : '/api/instructores';
        const method = id ? 'PUT' : 'POST';
        try {
            await fetchAPI(url, { method, body: JSON.stringify(payload) });
            modalInstructor.hide();
            showToast(id ? 'Instructor actualizado correctamente.' : 'Instructor creado correctamente.');
            await cargarDatosAdmin();
        } catch (e) {}
    });

    document.getElementById('form-usuario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('usuario-id').value;
        const password = document.getElementById('usuario-password').value;
        const payload = {
            nombre: document.getElementById('usuario-nombre').value,
            apellido: document.getElementById('usuario-apellido').value,
            correo: document.getElementById('usuario-correo').value,
            username: document.getElementById('usuario-username').value
        };
        if (password) payload.password = password;
        const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
        const method = id ? 'PUT' : 'POST';
        try {
            await fetchAPI(url, { method, body: JSON.stringify(payload) });
            modalUsuario.hide();
            showToast(id ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.');
            await cargarDatosAdmin();
        } catch (e) {}
    });

    document.getElementById('form-inscripcion').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            id_usuario: parseInt(document.getElementById('inscripcion-usuario').value),
            id_taller: parseInt(document.getElementById('inscripcion-taller').value)
        };
        try {
            await fetchAPI('/api/inscripciones', { method: 'POST', body: JSON.stringify(payload) });
            modalInscripcion.hide();
            showToast('Alumno inscrito correctamente.');
            await cargarDatosAdmin();
        } catch (e) {}
    });

    window.eliminarTaller = async (id) => {
        if (!confirm('Deseas eliminar este taller? Todas las inscripciones asociadas seran removidas.')) return;
        try {
            await fetchAPI(`/api/talleres/${id}`, { method: 'DELETE' });
            showToast('Taller eliminado correctamente.', 'info');
            await cargarTalleres();
        } catch (e) {}
    };

    window.eliminarCategoria = async (id) => {
        if (!confirm('Deseas eliminar esta categoria?')) return;
        try {
            await fetchAPI(`/api/categorias/${id}`, { method: 'DELETE' });
            showToast('Categoria eliminada correctamente.', 'info');
            await cargarDatosAdmin();
        } catch (e) {}
    };

    window.eliminarInstructor = async (id) => {
        if (!confirm('Deseas eliminar este instructor?')) return;
        try {
            await fetchAPI(`/api/instructores/${id}`, { method: 'DELETE' });
            showToast('Instructor eliminado correctamente.', 'info');
            await cargarDatosAdmin();
        } catch (e) {}
    };

    window.eliminarUsuario = async (id) => {
        if (!confirm('Deseas eliminar este usuario?')) return;
        try {
            await fetchAPI(`/api/usuarios/${id}`, { method: 'DELETE' });
            showToast('Usuario eliminado correctamente.', 'info');
            await cargarDatosAdmin();
        } catch (e) {}
    };

    window.eliminarInscripcion = async (id) => {
        if (!confirm('Deseas remover esta inscripcion? Se liberara un cupo en el taller.')) return;
        try {
            await fetchAPI(`/api/inscripciones/${id}`, { method: 'DELETE' });
            showToast('Inscripcion cancelada. Cupo liberado.', 'info');
            await cargarDatosAdmin();
        } catch (e) {}
    };

    filtroBusqueda.addEventListener('input', () => renderizarTalleresPublicos());
    filtroCategoria.addEventListener('change', () => renderizarTalleresPublicos());
    filtroDia.addEventListener('change', () => renderizarTalleresPublicos());

    tabAdmin.addEventListener('shown.bs.tab', () => { cargarDatosAdmin(); });

    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                if (submitBtn.disabled) return;
                submitBtn.dataset.originalHtml = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Procesando...';
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modalEl => {
        modalEl.addEventListener('shown.bs.modal', () => {
            const firstInput = modalEl.querySelector('input:not([type="hidden"]), select, textarea');
            if (firstInput) firstInput.focus();
        });
    });

    verificarSesion();
    cargarCatalogos();
});