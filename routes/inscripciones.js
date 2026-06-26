const express = require('express');
const router = express.Router();
const controller = require('../controllers/inscripcionController');

router.get('/', controller.listar);
router.get('/taller/:id', controller.listarPorTaller);
router.post('/', controller.agregar);
router.put('/:id', controller.editar);
router.delete('/:id', controller.eliminar);

module.exports = router;