import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3007;

app.use(cors()); 
app.use(express.json());

// 1. Conexión a MongoDB con Mongoose
const uri = process.env.MONGODB_URI;

// Evitamos reconexiones constantes en Serverless
if (mongoose.connection.readyState === 0) {
    mongoose.connect(uri)
      .then(() => console.log("Conectado a MongoDB Atlas"))
      .catch(err => console.error("Error al conectar a MongoDB:", err));
}

// 2. Monitoreo de estados (Para depurar errores de Atlas)
mongoose.connection.on('connected', () => console.log('🚀 Mongoose conectado a Atlas'));
mongoose.connection.on('error', (err) => console.log('🔥 Error de Mongoose:', err));
mongoose.connection.on('disconnected', () => console.log('🔌 Mongoose desconectado'));

// 3. Modelo de datos
const Category = mongoose.model('Category', { 
  name: { type: String, required: true }, 
  imageUrl: { type: String, required: true } 
});

// 4. CRUD con Try/Catch
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener categorías", error });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const newCategory = await Category.create(req.body);
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: "Error al crear categoría", error });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "No se encontró" });
        res.json({ ok: true, message: "Categoría eliminada" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar", error });
    }
});

// IMPORTANTE PARA LOCAL
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
}

// IMPORTANTE PARA VERCEL
export default app;