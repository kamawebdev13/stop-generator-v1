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

const uri = process.env.MONGODB_URI;

// 1. Middleware de Conexión (Garantiza DB lista)
const connectDB = async (req, res, next) => {
    if (mongoose.connection.readyState >= 1) return next();
    try {
        await mongoose.connect(uri);
        next();
    } catch (err) {
        res.status(500).json({ message: "Error de conexión a la base de datos" });
    }
};

// 2. Middleware de Seguridad (Protege POST y DELETE)
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.API_SECRET_KEY) {
        next();
    } else {
        res.status(403).json({ message: "Acceso denegado: API Key inválida" });
    }
};

app.use('/api', connectDB);

const Category = mongoose.models.Category || mongoose.model('Category', { 
  name: { type: String, required: true }, 
  imageUrl: { type: String, required: true } 
});

// --- RUTAS ---

// Pública: Cualquiera puede ver las categorías
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener categorías", error });
    }
});

// Protegida: Solo con API Key
app.post('/api/categories', verifyApiKey, async (req, res) => {
    try {
        const newCategory = await Category.create(req.body);
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: "Error al crear categoría", error });
    }
});

// Protegida: Solo con API Key
app.delete('/api/categories/:id', verifyApiKey, async (req, res) => {
    try {
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "No se encontró" });
        res.json({ ok: true, message: "Categoría eliminada" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar", error });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
}

export default app;