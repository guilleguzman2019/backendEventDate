const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Inicializar Express
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Conectar a MongoDB
mongoose.connect('mongodb+srv://guille16:guille16@cluster0.iorlh.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado a MongoDB');
}).catch((err) => {
  console.error('Error al conectar a MongoDB:', err);
});

// Definir el modelo de Invitación
const InvitacionSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  template: { type: String, required: true },
  estado: { type: String, default: 'Pendiente' },
  data: { type: String, default: '' },
});

const Invitacion = mongoose.model('Invitacion', InvitacionSchema);

// Definir el modelo de Confirmación
const ConfirmacionSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true },
  asiste: { type: String, required: true },
  datoImportante: { type: String, required: true },
  invitacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Invitacion', required: true },
});

const Confirmacion = mongoose.model('Confirmacion', ConfirmacionSchema);

const TransporteSchema = new mongoose.Schema({
  nombreCompleto: { 
    type: String, 
    required: true 
  },
  cantidadLugares: { 
    type: Number, 
    required: true,
    min: 1
  },
  hora: { 
    type: String, 
    required: true 
  },
  invitacion: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invitacion',
    required: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt
});

const Transporte = mongoose.model('Transporte', TransporteSchema);

const MusicaSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true 
  },
  autor: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String, 
    required: true,
  },
  invitacion: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invitacion',
    required: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt
});

const Musica = mongoose.model('Musica', MusicaSchema);

const storage = multer.diskStorage({
  destination: 'uploads/images/', // Carpeta donde se guardarán las imágenes
  filename: (req, file, cb) => {
    // Crear nombre único para cada imagen
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Verificar que sea una imagen
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes'));
  }
});

app.use('/images', express.static('uploads/images'));

app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }
    // Devolver la URL para acceder a la imagen
    const imageUrl = `/images/${req.file.filename}`;
    res.json({ 
      message: 'Imagen subida correctamente',
      imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload-multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron imágenes' });
    }

    // Procesar todas las imágenes subidas
    const uploadedImages = req.files.map(file => file.filename);

    res.json({
      message: `${uploadedImages.length} imágenes subidas correctamente`,
      images: uploadedImages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas de la API

// Obtener todas las invitaciones
app.get('/api/invitaciones', async (req, res) => {
  try {
    const invitaciones = await Invitacion.find();
    res.json(invitaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva invitación
app.post('/api/invitaciones', async (req, res) => {
  const { titulo, template, estado, data } = req.body;

  const nuevaInvitacion = new Invitacion({ titulo, template, estado, data });

  try {
    const invitacionGuardada = await nuevaInvitacion.save();
    res.status(201).json(invitacionGuardada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar una invitación por título
app.put('/api/invitaciones/:titulo', async (req, res) => {
  try {
    const invitacion = await Invitacion.findOneAndUpdate(
      { titulo: req.params.titulo },
      { $set: req.body },
      { new: true }
    );
    if (!invitacion) return res.status(404).json({ error: 'Invitación no encontrada' });
    res.json(invitacion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar una invitación por ID
app.delete('/api/invitaciones/:id', async (req, res) => {
  try {
    const invitacion = await Invitacion.findByIdAndDelete(req.params.titulo);
    if (!invitacion) return res.status(404).json({ error: 'Invitación no encontrada' });
    res.json({ message: 'Invitación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las confirmaciones
app.get('/api/confirmaciones', async (req, res) => {
  try {
    const confirmaciones = await Confirmacion.find().populate('invitacion');
    res.json(confirmaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva confirmación
app.post('/api/confirmaciones', async (req, res) => {
  const { nombreCompleto, asiste, datoImportante, invitacion } = req.body;

  const nuevaConfirmacion = new Confirmacion({ nombreCompleto, asiste, datoImportante, invitacion });

  try {
    const confirmacionGuardada = await nuevaConfirmacion.save();
    res.status(201).json(confirmacionGuardada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar una confirmación por ID
app.put('/api/confirmaciones/:id', async (req, res) => {
  try {
    const confirmacion = await Confirmacion.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!confirmacion) return res.status(404).json({ error: 'Confirmación no encontrada' });
    res.json(confirmacion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar una confirmación por ID
app.delete('/api/confirmaciones/:id', async (req, res) => {
  try {
    const confirmacion = await Confirmacion.findByIdAndDelete(req.params.id);
    if (!confirmacion) return res.status(404).json({ error: 'Confirmación no encontrada' });
    res.json({ message: 'Confirmación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//obtener todas los transportes
app.get('/api/transportes', async (req, res) => {
  try {
    const transportes = await Transporte.find().populate('invitacion');
    res.json(transportes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener transportes por invitación
app.get('/api/transportes/invitacion/:invitacionId', async (req, res) => {
  try {
    const transportes = await Transporte.find({ 
      invitacion: req.params.invitacionId 
    }).populate('invitacion');
    res.json(transportes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un nuevo transporte
app.post('/api/transportes', async (req, res) => {
  try {
    const { 
      nombreCompleto, 
      cantidadLugares, 
      hora, 
      invitacion 
    } = req.body;

    // Verificar que la invitación existe
    const invitacionExiste = await Invitacion.findById(invitacion);
    if (!invitacionExiste) {
      return res.status(400).json({ error: 'La invitación especificada no existe' });
    }

    const nuevoTransporte = new Transporte({ 
      nombreCompleto, 
      cantidadLugares, 
      hora, 
      invitacion 
    });

    const transporteGuardado = await nuevoTransporte.save();
    const transportePopulado = await Transporte.findById(transporteGuardado._id).populate('invitacion');
    res.status(201).json(transportePopulado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar un transporte
app.put('/api/transportes/:id', async (req, res) => {
  try {
    const { nombreCompleto, cantidadLugares, hora, invitacion } = req.body;

    // Si se proporciona una invitación, verificar que existe
    if (invitacion) {
      const invitacionExiste = await Invitacion.findById(invitacion);
      if (!invitacionExiste) {
        return res.status(400).json({ error: 'La invitación especificada no existe' });
      }
    }

    const transporte = await Transporte.findByIdAndUpdate(
      req.params.id,
      { 
        nombreCompleto, 
        cantidadLugares, 
        hora, 
        invitacion 
      },
      { new: true, runValidators: true }
    ).populate('invitacion');

    if (!transporte) {
      return res.status(404).json({ error: 'Transporte no encontrado' });
    }

    res.json(transporte);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar un transporte
app.delete('/api/transportes/:id', async (req, res) => {
  try {
    const transporte = await Transporte.findByIdAndDelete(req.params.id);
    if (!transporte) {
      return res.status(404).json({ error: 'Transporte no encontrado' });
    }
    res.json({ message: 'Transporte eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener transportes por nombre completo (búsqueda)
app.get('/api/transportes/buscar/:nombre', async (req, res) => {
  try {
    const transportes = await Transporte.find({
      nombreCompleto: { $regex: req.params.nombre, $options: 'i' }
    }).populate('invitacion');
    res.json(transportes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener disponibilidad por hora
app.get('/api/transportes/hora/:hora', async (req, res) => {
  try {
    const transportes = await Transporte.find({ 
      hora: req.params.hora 
    }).populate('invitacion');
    
    const lugaresTotales = transportes.reduce((total, t) => total + t.cantidadLugares, 0);
    
    res.json({
      transportes,
      lugaresTotales,
      cantidadTransportes: transportes.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/musica', async (req, res) => {
  try {
    const musica = await Musica.find().populate('invitacion');
    res.json(musica);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener canciones por invitación
app.get('/api/musica/invitacion/:invitacionId', async (req, res) => {
  try {
    const musica = await Musica.find({ 
      invitacion: req.params.invitacionId 
    }).populate('invitacion');
    res.json(musica);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar nueva canción
app.post('/api/musica', async (req, res) => {
  try {
    const { nombre, autor, link, invitacion } = req.body;

    // Verificar que la invitación existe
    const invitacionExiste = await Invitacion.findById(invitacion);
    if (!invitacionExiste) {
      return res.status(400).json({ error: 'La invitación especificada no existe' });
    }

    // Verificar si el link ya existe
    const linkExistente = await Musica.findOne({ link });
    if (linkExistente) {
      return res.status(400).json({ error: 'Esta canción ya ha sido agregada' });
    }

    const nuevaCancion = new Musica({
      nombre,
      autor,
      link,
      invitacion
    });

    const cancionGuardada = await nuevaCancion.save();
    const cancionPopulada = await Musica.findById(cancionGuardada._id).populate('invitacion');
    res.status(201).json(cancionPopulada);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar una canción
app.put('/api/musica/:id', async (req, res) => {
  try {
    const { nombre, autor, link, invitacion } = req.body;

    // Si se proporciona una invitación, verificar que existe
    if (invitacion) {
      const invitacionExiste = await Invitacion.findById(invitacion);
      if (!invitacionExiste) {
        return res.status(400).json({ error: 'La invitación especificada no existe' });
      }
    }

    // Si se está actualizando el link, verificar que no exista ya
    if (link) {
      const linkExistente = await Musica.findOne({ 
        link, 
        _id: { $ne: req.params.id } 
      });
      if (linkExistente) {
        return res.status(400).json({ error: 'Este link ya está en uso por otra canción' });
      }
    }

    const cancion = await Musica.findByIdAndUpdate(
      req.params.id,
      { nombre, autor, link, invitacion },
      { new: true, runValidators: true }
    ).populate('invitacion');

    if (!cancion) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }

    res.json(cancion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar una canción
app.delete('/api/musica/:id', async (req, res) => {
  try {
    const cancion = await Musica.findByIdAndDelete(req.params.id);
    if (!cancion) {
      return res.status(404).json({ error: 'Canción no encontrada' });
    }
    res.json({ message: 'Canción eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Búsqueda de canciones
app.get('/api/musica/buscar', async (req, res) => {
  try {
    const { query } = req.query;
    const musica = await Musica.find({
      $or: [
        { nombre: { $regex: query, $options: 'i' } },
        { autor: { $regex: query, $options: 'i' } }
      ]
    }).populate('invitacion');
    res.json(musica);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});