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

// Middleware para asegurar la conexión antes de cualquier ruta
const connectDB = async (req, res, next) => {
    if (mongoose.connection.readyState >= 1) {
        return next();
    }
    try {
        await mongoose.connect(uri);
        console.log("🚀 Conectado a MongoDB Atlas");
        next();
    } catch (err) {
        console.error("🔥 Error de conexión:", err);
        res.status(500).json({ message: "Error de conexión a la base de datos" });
    }
};

// Aplicar el middleware de conexión a todas las rutas de la API
app.use('/api', connectDB);

// Definición del modelo (evitando errores de re-compilación en Vercel)
const Category = mongoose.models.Category || mongoose.model('Category', { 
  name: { type: String, required: true }, 
  imageUrl: { type: String, required: true } 
});

// --- TUS RUTAS CRUD ---

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

// Local
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
}

// Vercel
export default app;