const db = require('../config/db');
const Instructor = require('../models/Instructor');

const listar = (req, res) => {
    db.query('SELECT * FROM instructores', (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al listar instructores' });
            return;
        }
        const instructores = filas.map(
            (fila) => new Instructor(fila.id, fila.nombre, fila.apellido, fila.id_categoria)
        );
        res.json(instructores);
    });
};

const agregar = (req, res) => {
    const { nombre, apellido, id_categoria } = req.body;
    if (!nombre || !apellido) {
        res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
        return;
    }
    db.query('INSERT INTO instructores (nombre, apellido, id_categoria) VALUES (?, ?, ?)', [nombre, apellido, id_categoria || null], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al agregar instructor' });
            return;
        }
        const nuevo = new Instructor(resultado.insertId, nombre, apellido, id_categoria || null);
        res.status(201).json(nuevo);
    });
};

const editar = (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, id_categoria } = req.body;
    if (!nombre || !apellido) {
        res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
        return;
    }
    db.query('UPDATE instructores SET nombre = ?, apellido = ?, id_categoria = ? WHERE id = ?', [nombre, apellido, id_categoria || null, id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al editar instructor' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Instructor no encontrado' });
            return;
        }
        res.json(new Instructor(id, nombre, apellido, id_categoria || null));
    });
};

const eliminar = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM instructores WHERE id = ?', [id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al eliminar instructor' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Instructor no encontrado' });
            return;
        }
        res.json({ mensaje: 'Instructor eliminado correctamente' });
    });
};

module.exports = { listar, agregar, editar, eliminar };