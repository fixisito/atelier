class Taller {
    constructor(id, id_categoria, nombre_taller, id_instructor, dia_semana, hora, cupos, descripcion) {
        this.id = id;
        this.id_categoria = id_categoria;
        this.nombre_taller = nombre_taller;
        this.id_instructor = id_instructor;
        this.dia_semana = dia_semana;
        this.hora = hora;
        this.cupos = cupos;
        this.descripcion = descripcion;
    }
}
module.exports = Taller;