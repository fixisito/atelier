# Atelier - Academia de Oficios y Artes

## 1. Integrantes del Grupo

| Integrante | Rol y Archivos Desarrollados |
|------------|------------------------------|
| **Catalina Aravena** | Desarrollo del frontend completo: estructura HTML (`public/index.html`), estilos CSS personalizados (`public/css/style.css`), diseño visual con Bootstrap, modales de formularios y logica JavaScript del cliente (`public/js/talleres.js`) incluyendo filtros de busqueda, sistema de notificaciones toast y renderizado dinamico de tarjetas y tablas. |
| **Aylin Carrera** | Desarrollo del backend y base de datos: diseño y creacion de la base de datos MySQL (`database.sql`), modelos de datos (`models/`), controladores con logica CRUD (`controllers/`), definicion de rutas de la API REST (`routes/`) y configuracion de la conexion a base de datos (`config/db.js`). |
| **Alonso Leiva** | Configuracion del servidor Express (`server.js`), implementacion del sistema de login y autenticacion (`usuarioController.js` - funcion login), control de acceso al panel de administracion, archivo `.gitignore`, documentacion del proyecto (`README.md`) y pruebas de funcionamiento. |

## 2. Descripcion del Proyecto

**Atelier** es una academia de oficios y artes que ofrece talleres de ceramica, costura, pintura, musica y mas. El sistema web permite a los visitantes ver los talleres disponibles e inscribirse, mientras que los administradores pueden gestionar talleres, categorias, instructores, usuarios e inscripciones desde un panel protegido con login. Area asignada: **Entretenimiento**.

## 3. Requisitos Previos

- **Node.js** v18 o superior
- **XAMPP** (con Apache y MySQL activos) o **Bitnami WAMP**
- Navegador web actualizado (Chrome, Firefox, Edge)

## 4. Instalacion Paso a Paso

1. Clonar o descomprimir el proyecto en una carpeta local
2. Abrir XAMPP e iniciar los servicios **Apache** y **MySQL**
3. Importar la base de datos (ver seccion 5)
4. Abrir una terminal en la carpeta raiz del proyecto y ejecutar:
   ```
   npm install
   ```
5. Iniciar el servidor:
   ```
   node server.js
   ```
6. Abrir el navegador en `http://localhost:3000`

## 5. Configuracion de la Base de Datos

| Campo | Valor |
|-------|-------|
| Host | localhost |
| Usuario | root |
| Contraseña | *(vacio)* |
| Base de datos | atelierdb |
| Archivo SQL | `database.sql` (en la raiz del proyecto) |

Para importar la base de datos:
1. Abrir **phpMyAdmin** en `http://localhost/phpmyadmin`
2. Ir a la pestana **Importar**
3. Seleccionar el archivo `database.sql` ubicado en la raiz del proyecto
4. Ejecutar la importacion

## 6. Credenciales de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | 12345 | Administrador (acceso al panel completo) |
| maria | 12345 | Alumno (solo vista publica) |

## 7. Uso del Sistema

### Vista Publica (sin login)
- Al acceder a `http://localhost:3000` se muestra la pagina principal con los talleres disponibles
- Se pueden filtrar talleres por nombre, categoria o dia de la semana
- Los visitantes pueden inscribirse a un taller completando el formulario de inscripcion

### Acceso al Panel de Administracion
- Hacer clic en el boton **Acceder** en la esquina superior derecha
- Ingresar las credenciales de administrador (admin / 12345)
- Se habilita la pestana **Panel de Control** con las siguientes secciones:

### Operaciones del Panel (CRUD)
- **Talleres**: Crear, ver, editar y eliminar talleres con su categoria, instructor, horario y cupos
- **Categorias**: Gestionar las categorias disponibles para los talleres
- **Instructores**: Registrar y administrar instructores con su especialidad
- **Usuarios / Alumnos**: Crear, editar y eliminar usuarios del sistema
- **Inscripciones**: Ver el historial de inscripciones y cancelar registros

## 8. Estructura del Proyecto

```
atelier/
├── config/
│   └── db.js                    # Conexion a la base de datos MySQL
├── controllers/
│   ├── categoriaController.js   # Logica CRUD de categorias
│   ├── inscripcionController.js # Logica CRUD de inscripciones
│   ├── instructorController.js  # Logica CRUD de instructores
│   ├── tallerController.js      # Logica CRUD de talleres
│   └── usuarioController.js     # Logica CRUD de usuarios y login
├── models/
│   ├── Categoria.js             # Clase modelo de Categoria
│   ├── Inscripcion.js           # Clase modelo de Inscripcion
│   ├── Instructor.js            # Clase modelo de Instructor
│   ├── Taller.js                # Clase modelo de Taller
│   └── Usuario.js               # Clase modelo de Usuario
├── public/
│   ├── css/
│   │   └── style.css            # Estilos personalizados del sitio
│   ├── img/
│   │   ├── Atelier.png          # Imagen de marca
│   │   └── logoAtelier.png      # Logo del negocio
│   ├── js/
│   │   └── talleres.js          # Logica del frontend (fetch, DOM, filtros)
│   └── index.html               # Pagina principal (vista publica + panel admin)
├── routes/
│   ├── categorias.js            # Rutas API de categorias
│   ├── inscripciones.js         # Rutas API de inscripciones
│   ├── instructores.js          # Rutas API de instructores
│   ├── talleres.js              # Rutas API de talleres
│   └── usuarios.js              # Rutas API de usuarios (incluye /login)
├── .gitignore                   # Excluye node_modules del repositorio
├── package.json                 # Dependencias y scripts del proyecto
├── database.sql                 # Script SQL para crear la base de datos
├── server.js                    # Servidor Express (puerto 3000)
└── README.md                    # Documentacion del proyecto
```