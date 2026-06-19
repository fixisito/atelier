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
                setTimeout(() => {
                    if (toast.parentElement) toast.remove();
                }, 300);
            }
        };

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismissToast();
        });

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
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Ocurrio un error inesperado');
            }
            return data;
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        } finally {
            peticionesActivas--;
            if (peticionesActivas === 0) {
                restablecerBotonesFormularios();
            }
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
                const tabPublicoBtn = new bootstrap.Tab(tabPublico);
                tabPublicoBtn.show();
            }
        } else {
            estado.usuarioLogueado = null;
            btnLoginTrigger.classList.remove('d-none');
            btnLogout.classList.add('d-none');
            sessionInfo.classList.add('d-none');
            tabAdmin.classList.add('d-none');

            const tabPublicoBtn = new bootstrap.Tab(tabPublico);
            tabPublicoBtn.show();
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

            if (data.role === 'admin') {
                const tabAdminBtn = new bootstrap.Tab(tabAdmin);
                tabAdminBtn.show();
            }
        } catch (err) {
            errorMsg.classList.remove('d-none');
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

    const renderizarTalleresPublicos = (inscripciones = []) => {
        const texto = filtroBusqueda.value.toLowerCase().trim();
        const categoriaId = filtroCategoria.value;
        const dia = filtroDia.value;

        const filtrados = estado.talleres.filter(t => {
            const matchesTexto = t.nombre_taller.toLowerCase().includes(texto) || t.descripcion.toLowerCase().includes(texto);
            const matchesCategoria = !categoriaId || t.id_categoria == categoriaId;
            const matchesDia = !dia || t.dia_semana === dia;
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
                                <i class="fa-solid fa-calendar-day me-2 text-indigo"></i><strong>Horario:</strong> ${taller.dia_semana} a las ${taller.hora.substring(0, 5)} hrs.
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
                    <td>${t.dia_semana} - ${t.hora.substring(0, 5)}</td>
                    <td><strong class="text-primary">${ocupados}</strong> / ${t.cupos}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-dark btn-sm me-1" onclick="prepararEditarTaller(${t.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminarTaller(${t.id})">
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
                    <button class="btn btn-outline-dark btn-sm me-1" onclick="prepararEditarCategoria(${c.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarCategoria(${c.id})">
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
                        <button class="btn btn-outline-dark btn-sm me-1" onclick="prepararEditarInstructor(${i.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminarInstructor(${i.id})">
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
                    <button class="btn btn-outline-dark btn-sm me-1" onclick="prepararEditarUsuario(${u.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    ${u.role === 'admin' ? '' : `<button class="btn btn-outline-danger btn-sm" onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button>`}
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

    window.prepararCrearTaller = () => {
        actualizarSelectsModales();
        document.getElementById('form-taller').reset();
        document.getElementById('taller-id').value = '';
        document.getElementById('modalTaller-titulo').textContent = 'Nuevo Taller';
    };
    window.prepararEditarTaller = (id) => {
        actualizarSelectsModales();
        const t = estado.talleres.find(t => t.id === id);
        if (!t) return;
        document.getElementById('taller-id').value = t.id;
        document.getElementById('taller-nombre').value = t.nombre_taller;
        document.getElementById('taller-categoria').value = t.id_categoria || '';
        document.getElementById('taller-instructor').value = t.id_instructor || '';
        document.getElementById('taller-dia').value = t.dia_semana;
        document.getElementById('taller-hora').value = t.hora;
        document.getElementById('taller-cupos').value = t.cupos;
        document.getElementById('taller-descripcion').value = t.descripcion;
        document.getElementById('modalTaller-titulo').textContent = 'Editar Taller';
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

    const inscribirUsuarioLogueado = async (idUsuario, idTaller) => {
        try {
            await fetchAPI('/api/inscripciones', {
                method: 'POST',
                body: JSON.stringify({ id_usuario: idUsuario, id_taller: idTaller })
            });
            showToast('Te has inscrito correctamente en el taller.', 'success');
            await cargarTalleres();
        } catch (e) { }
    };

    window.abrirPreinscripcion = (tallerId) => {
        const t = estado.talleres.find(taller => taller.id === tallerId);
        if (!t) return;

        if (estado.usuarioLogueado) {
            if (confirm(`¿Deseas inscribirte en el taller "${t.nombre_taller}"?`)) {
                inscribirUsuarioLogueado(estado.usuarioLogueado.id, t.id);
            }
        } else {
            document.getElementById('form-preinscripcion').reset();
            document.getElementById('preinscripcion-taller-id').value = t.id;
            document.getElementById('preinscripcion-taller-nombre').textContent = t.nombre_taller;
            document.getElementById('preinscripcion-taller-dia').textContent = t.dia_semana;
            document.getElementById('preinscripcion-taller-hora').textContent = t.hora.substring(0, 5);

            modalPreinscripcion.show();
        }
    };

    document.getElementById('form-taller').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('taller-id').value;
        const payload = {
            nombre_taller: document.getElementById('taller-nombre').value,
            id_categoria: parseInt(document.getElementById('taller-categoria').value),
            id_instructor: parseInt(document.getElementById('taller-instructor').value),
            dia_semana: document.getElementById('taller-dia').value,
            hora: document.getElementById('taller-hora').value,
            cupos: parseInt(document.getElementById('taller-cupos').value),
            descripcion: document.getElementById('taller-descripcion').value
        };

        const url = id ? `/api/talleres/${id}` : '/api/talleres';
        const method = id ? 'PUT' : 'POST';

        try {
            await fetchAPI(url, { method, body: JSON.stringify(payload) });
            modalTaller.hide();
            showToast(id ? 'Taller actualizado correctamente.' : 'Taller creado correctamente.');
            await cargarTalleres();
        } catch (e) { }
    });

    document.getElementById('form-categoria').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('categoria-id').value;
        const payload = {
            nombre_categoria: document.getElementById('categoria-nombre').value
        };

        const url = id ? `/api/categorias/${id}` : '/api/categorias';
        const method = id ? 'PUT' : 'POST';

        try {
            await fetchAPI(url, { method, body: JSON.stringify(payload) });
            modalCategoria.hide();
            showToast(id ? 'Categoria actualizada correctamente.' : 'Categoria creada correctamente.');
            await cargarDatosAdmin();
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
    });

    document.getElementById('form-preinscripcion').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id_taller = parseInt(document.getElementById('preinscripcion-taller-id').value);
        const userPayload = {
            nombre: document.getElementById('pre-nombre').value,
            apellido: document.getElementById('pre-apellido').value,
            correo: document.getElementById('pre-correo').value,
            username: document.getElementById('pre-username').value,
            password: document.getElementById('pre-password').value
        };

        try {
            let userResult;
            try {
                userResult = await fetchAPI('/api/usuarios', { method: 'POST', body: JSON.stringify(userPayload) });
            } catch (err) {
                if (err.message.includes('registrados')) {
                    userResult = await fetchAPI('/api/usuarios/login', {
                        method: 'POST',
                        body: JSON.stringify({ username: userPayload.username, password: userPayload.password })
                    });
                } else {
                    throw err;
                }
            }

            await fetchAPI('/api/inscripciones', {
                method: 'POST',
                body: JSON.stringify({ id_usuario: userResult.id, id_taller })
            });

            localStorage.setItem('atelier_session', JSON.stringify({
                id: userResult.id,
                nombre: userResult.nombre,
                apellido: userResult.apellido,
                correo: userResult.correo,
                username: userResult.username,
                role: userResult.role || 'alumno'
            }));

            modalPreinscripcion.hide();
            showToast('Te has inscrito correctamente en el taller.', 'success');
            verificarSesion();
            await cargarTalleres();
        } catch (e) { }
    });

    window.eliminarTaller = async (id) => {
        if (!confirm('Deseas eliminar este taller? Todas las inscripciones asociadas seran removidas.')) return;
        try {
            await fetchAPI(`/api/talleres/${id}`, { method: 'DELETE' });
            showToast('Taller eliminado correctamente.', 'info');
            await cargarTalleres();
        } catch (e) { }
    };

    window.eliminarCategoria = async (id) => {
        if (!confirm('Deseas eliminar esta categoria?')) return;
        try {
            await fetchAPI(`/api/categorias/${id}`, { method: 'DELETE' });
            showToast('Categoria eliminada correctamente.', 'info');
            await cargarDatosAdmin();
        } catch (e) { }
    };

    window.eliminarInstructor = async (id) => {
        if (!confirm('Deseas eliminar este instructor?')) return;
        try {
            await fetchAPI(`/api/instructores/${id}`, { method: 'DELETE' });
            showToast('Instructor eliminado correctamente.', 'info');
            await cargarDatosAdmin();
        } catch (e) { }
    };

    window.eliminarUsuario = async (id) => {
        if (!confirm('Deseas eliminar este usuario?')) return;
        try {
            await fetchAPI(`/api/usuarios/${id}`, { method: 'DELETE' });
            showToast('Usuario eliminado correctamente.', 'info');
            await cargarDatosAdmin();
        } catch (e) { }
    };

    window.eliminarInscripcion = async (id) => {
        if (!confirm('Deseas remover esta inscripcion? Se liberara un cupo en el taller.')) return;
        try {
            await fetchAPI(`/api/inscripciones/${id}`, { method: 'DELETE' });
            showToast('Inscripcion cancelada. Cupo liberado.', 'info');
            await cargarDatosAdmin();
        } catch (e) { }
    };

    filtroBusqueda.addEventListener('input', () => renderizarTalleresPublicos());
    filtroCategoria.addEventListener('change', () => renderizarTalleresPublicos());
    filtroDia.addEventListener('change', () => renderizarTalleresPublicos());

    tabAdmin.addEventListener('shown.bs.tab', () => {
        cargarDatosAdmin();
    });

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