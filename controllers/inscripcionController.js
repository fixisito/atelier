const db = require('../config/db');
const Inscripcion = require('../models/Inscripcion');

const listar = (req, res) => {
    db.query('SELECT * FROM inscripciones', (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al listar inscripciones' });
            return;
        }
        const inscripciones = filas.map(
            (fila) => new Inscripcion(fila.id, fila.id_usuario, fila.id_taller, fila.fecha_inscripcion)
        );
        res.json(inscripciones);
    });
};

const listarPorTaller = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT u.nombre, u.apellido, u.correo, u.username, i.fecha_inscripcion
        FROM inscripciones i
        JOIN usuarios u ON u.id = i.id_usuario
        WHERE i.id_taller = ?
        ORDER BY i.fecha_inscripcion ASC
    `;
    db.query(query, [id], (err, filas) => {
        if (err) {
            res.status(500).json({ error: 'Error al listar alumnos del taller' });
            return;
        }
        res.json(filas);
    });
};

const agregar = (req, res) => {
    const { id_usuario, id_taller } = req.body;
    if (!id_usuario || !id_taller) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    db.query(
        'SELECT cupos, (SELECT COUNT(*) FROM inscripciones WHERE id_taller = talleres.id) as inscritos FROM talleres WHERE id = ?',
        [id_taller],
        (err, resultadoTaller) => {
            if (err) {
                res.status(500).json({ error: 'Error al verificar taller' });
                return;
            }
            if (resultadoTaller.length === 0) {
                res.status(404).json({ error: 'Taller no encontrado' });
                return;
            }

            const { cupos, inscritos } = resultadoTaller[0];
            if (inscritos >= cupos) {
                res.status(400).json({ error: 'No hay cupos disponibles en este taller' });
                return;
            }

            db.query('SELECT * FROM inscripciones WHERE id_usuario = ? AND id_taller = ?', [id_usuario, id_taller], (err, inscripcionExistente) => {
                if (err) {
                    res.status(500).json({ error: 'Error al verificar inscripcion' });
                    return;
                }
                if (inscripcionExistente.length > 0) {
                    res.status(400).json({ error: 'El usuario ya esta inscrito en este taller' });
                    return;
                }

                db.query('INSERT INTO inscripciones (id_usuario, id_taller) VALUES (?, ?)', [id_usuario, id_taller], (err, resultado) => {
                    if (err) {
                        res.status(500).json({ error: 'Error al agregar inscripcion' });
                        return;
                    }
                    const nuevo = new Inscripcion(resultado.insertId, id_usuario, id_taller, new Date());
                    res.status(201).json(nuevo);
                });
            });
        }
    );
};

const editar = (req, res) => {
    const { id } = req.params;
    const { id_usuario, id_taller } = req.body;

    if (!id_usuario || !id_taller) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    db.query('UPDATE inscripciones SET id_usuario = ?, id_taller = ? WHERE id = ?', [id_usuario, id_taller, id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al editar inscripcion' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Inscripcion no encontrada' });
            return;
        }
        res.json(new Inscripcion(id, id_usuario, id_taller, new Date()));
    });
};

const eliminar = (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM inscripciones WHERE id = ?', [id], (err, resultado) => {
        if (err) {
            res.status(500).json({ error: 'Error al eliminar inscripcion' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Inscripcion no encontrada' });
            return;
        }
        res.json({ mensaje: 'Inscripcion eliminada correctamente' });
    });
};

module.exports = { listar, listarPorTaller, agregar, editar, eliminar };