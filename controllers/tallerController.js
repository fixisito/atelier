const db = require('../config/db');
const Taller = require('../models/Taller');

const listar = (req, res) => {
    const query = `
        SELECT t.id, t.id_categoria, t.nombre_taller, t.id_instructor, t.cupos, t.descripcion,
               h.dia_semana, h.hora
        FROM talleres t
        LEFT JOIN horarios_taller h ON h.id_taller = t.id
        ORDER BY t.id
    `;
    db.query(query, (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al listar talleres' });
            return;
        }

        const mapaT = {};
        filas.forEach(fila => {
            if (!mapaT[fila.id]) {
                mapaT[fila.id] = new Taller(
                    fila.id, fila.id_categoria, fila.nombre_taller,
                    fila.id_instructor, fila.cupos, fila.descripcion, []
                );
            }
            if (fila.dia_semana && fila.hora) {
                mapaT[fila.id].horarios.push({ dia_semana: fila.dia_semana, hora: fila.hora });
            }
        });

        res.json(Object.values(mapaT));
    });
};

const agregar = (req, res) => {
    const { id_categoria, nombre_taller, id_instructor, cupos, descripcion, horarios } = req.body;

    if (!id_categoria || !nombre_taller || !id_instructor || !cupos || !descripcion) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    if (!horarios || horarios.length === 0) {
        res.status(400).json({ error: 'Debes agregar al menos un horario' });
        return;
    }

    db.query(
        'INSERT INTO talleres (id_categoria, nombre_taller, id_instructor, cupos, descripcion) VALUES (?, ?, ?, ?, ?)',
        [id_categoria, nombre_taller, id_instructor, cupos, descripcion],
        (err, resultado) => {
            if (err) {
                res.status(500).json({ error: 'Error al agregar taller' });
                return;
            }

            const idTaller = resultado.insertId;

            const valoresH = horarios.map(h => [idTaller, h.dia_semana, h.hora]);
            db.query('INSERT INTO horarios_taller (id_taller, dia_semana, hora) VALUES ?', [valoresH], (errH) => {
                if (errH) {
                    res.status(500).json({ error: 'Error al guardar horarios' });
                    return;
                }
                const nuevo = new Taller(idTaller, id_categoria, nombre_taller, id_instructor, cupos, descripcion, horarios);
                res.status(201).json(nuevo);
            });
        }
    );
};

const editar = (req, res) => {
    const { id } = req.params;
    const { id_categoria, nombre_taller, id_instructor, cupos, descripcion, horarios } = req.body;

    if (!id_categoria || !nombre_taller || !id_instructor || !cupos || !descripcion) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    if (!horarios || horarios.length === 0) {
        res.status(400).json({ error: 'Debes agregar al menos un horario' });
        return;
    }

    db.query(
        'UPDATE talleres SET id_categoria = ?, nombre_taller = ?, id_instructor = ?, cupos = ?, descripcion = ? WHERE id = ?',
        [id_categoria, nombre_taller, id_instructor, cupos, descripcion, id],
        (err, resultado) => {
            if (err) {
                res.status(500).json({ error: 'Error al editar taller' });
                return;
            }
            if (resultado.affectedRows === 0) {
                res.status(404).json({ error: 'Taller no encontrado' });
                return;
            }

            db.query('DELETE FROM horarios_taller WHERE id_taller = ?', [id], (errD) => {
                if (errD) {
                    res.status(500).json({ error: 'Error al actualizar horarios' });
                    return;
                }

                const valoresH = horarios.map(h => [id, h.dia_semana, h.hora]);
                db.query('INSERT INTO horarios_taller (id_taller, dia_semana, hora) VALUES ?', [valoresH], (errI) => {
                    if (errI) {
                        res.status(500).json({ error: 'Error al insertar horarios nuevos' });
                        return;
                    }
                    res.json(new Taller(id, id_categoria, nombre_taller, id_instructor, cupos, descripcion, horarios));
                });
            });
        }
    );
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