const db = require('../config/db');
const Categoria = require('../models/Categoria');

const listar = (req, res) => {
    db.query('SELECT * FROM categorias', (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al listar categorias' });
            return;
        }
        const categorias = filas.map(
            (fila) => new Categoria(fila.id, fila.nombre_categoria)
        );
        res.json(categorias);
    });
};

const agregar = (req, res) => {
    const { nombre_categoria } = req.body;
    if (!nombre_categoria) {
        res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
        return;
    }
    db.query('INSERT INTO categorias (nombre_categoria) VALUES (?)', [nombre_categoria], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al agregar categoria' });
            return;
        }
        const nueva = new Categoria(resultado.insertId, nombre_categoria);
        res.status(201).json(nueva);
    });
};

const editar = (req, res) => {
    const { id } = req.params;
    const { nombre_categoria } = req.body;
    if (!nombre_categoria) {
        res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
        return;
    }
    db.query('UPDATE categorias SET nombre_categoria = ? WHERE id = ?', [nombre_categoria, id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al editar categoria' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Categoria no encontrada' });
            return;
        }
        res.json(new Categoria(id, nombre_categoria));
    });
};

const eliminar = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM categorias WHERE id = ?', [id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al eliminar categoria' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Categoria no encontrada' });
            return;
        }
        res.json({ mensaje: 'Categoria eliminada correctamente' });
    }); 
};

module.exports = { listar, agregar, editar, eliminar };