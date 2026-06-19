class Usuario {
    constructor(id, nombre, apellido, correo, username, password, role) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.correo = correo;
        this.username = username;
        this.password = password;
        this.role = role;
    }
}
module.exports = Usuario;