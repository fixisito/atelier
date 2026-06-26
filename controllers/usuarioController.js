const db = require('../config/db');
const Usuario = require('../models/Usuario');

const listar = (req, res) => {
    db.query('SELECT id, nombre, apellido, correo, username, role FROM usuarios', (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al listar usuarios' });
            return;
        }
        const usuarios = filas.map(
            (fila) => new Usuario(fila.id, fila.nombre, fila.apellido, fila.correo, fila.username, null, fila.role)
        );
        res.json(usuarios);
    });
};

const agregar = (req, res) => {
    const { nombre, apellido, correo, username, password, role } = req.body;
    if (!nombre || !apellido || !correo || !username || !password) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }
    const rolUsuario = role || 'alumno';
    db.query('INSERT INTO usuarios (nombre, apellido, correo, username, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, apellido, correo, username, password, rolUsuario],
        (err, resultado) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    res.status(400).json({ error: 'El correo o username ya estan registrados' });
                } else {
                    res.status(500).json({ error: 'Error al registrar usuario' });
                }
                return;
            }
            const nuevo = new Usuario(resultado.insertId, nombre, apellido, correo, username, null, rolUsuario);
            res.status(201).json(nuevo);
        }
    );
};

const editar = (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, correo, username, password } = req.body;
    if (!nombre || !apellido || !correo || !username) {
        res.status(400).json({ error: 'Campos requeridos vacios' });
        return;
    }

    let query = 'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, username = ?';
    let params = [nombre, apellido, correo, username];

    if (password) {
        query += ', password = ?';
        params.push(password);
    }
    query += ' WHERE id = ?';
    params.push(id);

    db.query(query, params, (err, resultado) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'El correo o username ya estan registrados' });
            } else {
                res.status(500).json({ error: 'Error al editar usuario' });
            }
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.json(new Usuario(parseInt(id), nombre, apellido, correo, username, null));
    });
};

const eliminar = (req, res) => {
    const { id } = req.params;
    db.query('SELECT role FROM usuarios WHERE id = ?', [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Error al verificar rol' });
            return;
        }
        if (rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        if (rows[0].role === 'admin') {
            res.status(403).json({ error: 'No se puede eliminar un usuario admin' });
            return;
        }
        db.query('DELETE FROM usuarios WHERE id = ?', [id], (errDel, resultado) => {
            if (errDel) {
                res.status(500).json({ error: 'Error al eliminar usuario' });
                return;
            }
            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            res.json({ mensaje: 'Usuario eliminado correctamente' });
        });
    });
};

const login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username y password requeridos' });
        return;
    }
    db.query('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password], (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error en el servidor al intentar iniciar sesion' });
            return;
        }
        if (filas.length === 0) {
            res.status(401).json({ error: 'Credenciales invalidas' });
            return;
        }
        const usuario = filas[0];
        res.json({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            username: usuario.username,
            role: usuario.role
        });
    });
};

const verificarCorreo = (req, res) => {
    const { correo } = req.query;
    if (!correo) {
        res.status(400).json({ error: 'El correo es requerido' });
        return;
    }
    db.query('SELECT id, nombre, apellido, username FROM usuarios WHERE correo = ?', [correo], (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al verificar correo' });
            return;
        }
        if (filas.length === 0) {
            res.json({ existe: false });
        } else {
            res.json({ existe: true, nombre: filas[0].nombre, username: filas[0].username });
        }
    });
};

module.exports = { listar, agregar, editar, eliminar, login, verificarCorreo };
