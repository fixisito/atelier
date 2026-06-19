const db = require('../config/db');
const Taller= require('../models/Taller');

const listar = (req, res) => {
    db.query('SELECT * FROM talleres', (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al listar talleres' });
            return;
        }
        
        const talleres = filas.map(
            (fila) => new Taller(fila.id, fila.id_categoria, fila.nombre_taller, fila.id_instructor, fila.dia_semana, fila.hora, fila.cupos, fila.descripcion)
        );
        res.json(talleres);
    });
};
const agregar = (req, res) => {
    const { id_categoria, nombre_taller, id_instructor, dia_semana, hora, cupos, descripcion } = req.body;
    if (!id_categoria || !nombre_taller || !id_instructor || !dia_semana || !hora || !cupos || !descripcion) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    db.query('INSERT INTO talleres (id_categoria, nombre_taller, id_instructor, dia_semana, hora, cupos, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)', [id_categoria, nombre_taller, id_instructor, dia_semana, hora, cupos, descripcion], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al agregar taller' });
            return;
        }
        const nuevo = new Taller(resultado.insertId, id_categoria, nombre_taller, id_instructor, dia_semana, hora, cupos, descripcion);
        res.status(201).json(nuevo);
    });
};

const editar = (req, res) => {
    const { id } = req.params;
    const { id_categoria, nombre_taller, id_instructor, dia_semana, hora, cupos, descripcion } = req.body;

    if (!id_categoria || !nombre_taller || !id_instructor || !dia_semana || !hora || !cupos || !descripcion) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    db.query('UPDATE talleres SET id_categoria = ?, nombre_taller = ?, id_instructor = ?, dia_semana = ?, hora = ?, cupos = ?, descripcion = ? WHERE id = ?', [id_categoria, nombre_taller, id_instructor, dia_semana, hora, cupos, descripcion, id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al editar taller' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Taller no encontrado' });
            return;
        }
        res.json(new Taller(id, id_categoria, nombre_taller, id_instructor, dia_semana, hora, cupos, descripcion));
    });
};

const eliminar = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM talleres WHERE id = ?', [id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al eliminar taller' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Taller no encontrado' });
            return;
        }
        res.json({ mensaje: 'Taller eliminado correctamente' });
    });
};

module.exports = { listar, agregar, editar, eliminar };