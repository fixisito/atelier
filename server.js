const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const talleresRouter = require('./routes/talleres');
const usuariosRouter = require('./routes/usuarios');
const categoriasRouter = require('./routes/categorias');
const instructoresRouter = require('./routes/instructores');
const inscripcionesRouter = require('./routes/inscripciones');

app.use('/api/talleres', talleresRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/instructores', instructoresRouter);
app.use('/api/inscripciones', inscripcionesRouter);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});