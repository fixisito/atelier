const express = require('express');
const router = express.Router();
const controller = require('../controllers/instructorController');

router.get('/', controller.listar);
router.post('/', controller.agregar);
router.put('/:id', controller.editar);
router.delete('/:id', controller.eliminar);

module.exports = router;