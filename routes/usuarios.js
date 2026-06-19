const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarioController');

router.get('/', controller.listar);
router.post('/', controller.agregar);
router.post('/login', controller.login);
router.put('/:id', controller.editar);
router.delete('/:id', controller.eliminar);

module.exports = router;