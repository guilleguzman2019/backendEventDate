const express = require('express');
const mongoose = require('mongoose');
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
    const invitacion = await Invitacion.findByIdAndDelete(req.params.id);
    if (!invitacion) return res.status(404).json({ error: 'Invitación no encontrada' });
    res.json({ message: 'Invitación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
