CREATE DATABASE IF NOT EXISTS atelierdb;

USE atelierdb;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','instructor','alumno') NOT NULL DEFAULT 'alumno'
);

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS instructores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    id_categoria INT,
    FOREIGN KEY (id_categoria) REFERENCES categorias (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS talleres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT,
    nombre_taller VARCHAR(100) NOT NULL,
    id_instructor INT,
    cupos INT NOT NULL,
    descripcion TEXT,
    FOREIGN KEY (id_instructor) REFERENCES instructores (id) ON DELETE SET NULL,
    FOREIGN KEY (id_categoria) REFERENCES categorias (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS horarios_taller (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_taller INT NOT NULL,
    dia_semana ENUM('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado') NOT NULL,
    hora TIME NOT NULL,
    FOREIGN KEY (id_taller) REFERENCES talleres (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    id_usuario INT,
    id_taller INT,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id) ON DELETE CASCADE,
    FOREIGN KEY (id_taller) REFERENCES talleres (id) ON DELETE CASCADE
);

INSERT INTO usuarios (nombre, apellido, correo, username, password, role) VALUES
('Admin', 'User', 'admin@atelier.cl', 'admin', '12345', 'admin'),
('Maria', 'Lopez', 'maria@atelier.cl', 'maria', '12345', 'alumno');

INSERT INTO categorias (nombre_categoria) VALUES
('Ceramica'), ('Costura'), ('Pintura'), ('Musica'), ('Danza'),
('Artesania'), ('Jardineria'), ('Escritura'), ('Yoga'), ('Literatura'),
('Cine'), ('Teatro'), ('Bordado'), ('Crochet'), ('Dibujo');

INSERT INTO instructores (nombre, apellido, id_categoria) VALUES
('Elena', 'Ruiz', 1),
('Carlos', 'Mura', 2);

INSERT INTO talleres (nombre_taller, id_instructor, id_categoria, cupos, descripcion) VALUES
('Taller de Ceramica', 1, 1, 10, 'Introduccion al modelado en arcilla.'),
('Introduccion a la Costura', 2, 2, 8, 'Aprende las puntadas basicas y manejo de maquina.');

INSERT INTO horarios_taller (id_taller, dia_semana, hora) VALUES
(1, 'Lunes', '10:00:00'),
(1, 'Miercoles', '10:00:00'),
(2, 'Martes', '15:00:00');