require('dotenv').config();
const express = require('express');
const db = require('./db');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/enquetes', async (req, res) => {
    try {
        const results = await db.selectAllEnquetes();
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar enquetes.' });
    }
});

app.get('/enquetes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.selectEnqueteById(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao obter a enquete.' });
    }
});
app.post('/enquetes', async (req, res) => {
    try {
        const enquete = req.body;
        const newEnquete = await db.createEnquete(enquete);
        res.status(201).json(newEnquete);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar a enquete.' });
    }
});

app.put('/enquetes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const enquete = req.body;
        const updatedEnquete = await db.updateEnquete(id, enquete);
        res.json(updatedEnquete);
        console.log(req.body);
        console.log(updatedEnquete);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar a enquete.' });
    }
});

app.delete('/enquetes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await db.deleteEnquete(id);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar a enquete.' });
    }
});
app.post('/enquetes/:id/votar', async (req, res) => {
    const { id } = req.params;
    const { id: opcaoId } = req.body;
    const updatedOption = await db.voteOption(opcaoId);
    res.json(updatedOption);
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor rodando na porta 3000');
});
