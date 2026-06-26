class Taller {
    constructor(id, id_categoria, nombre_taller, id_instructor, cupos, descripcion, horarios = []) {
        this.id = id;
        this.id_categoria = id_categoria;
        this.nombre_taller = nombre_taller;
        this.id_instructor = id_instructor;
        this.cupos = cupos;
        this.descripcion = descripcion;
        this.horarios = horarios;
    }
}
module.exports = Taller;