// server.js

require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 5001;

// Middleware setup
app.use(cors()); // Allow cross-origin requests from React frontend
app.use(express.json()); // Enable reading JSON data from request body

// --- MySQL Connection Setup using .env variables ---
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,       // From .env
    password: process.env.DB_PASSWORD, // From .env
    database: process.env.DB_NAME      // From .env
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database.');
});

// ------------------------------------
// API: Authentication (Username Only)
// ------------------------------------
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).send({ message: 'Username is required' });
    }
    res.send({ 
        success: true, 
        message: 'Login successful', 
        user: { username }
    });
});

// ------------------------------------
// API: Todo List (CRUD Operations)
// ------------------------------------

// 1. READ: Get all todos for a specific user
app.get('/api/todos/:username', (req, res) => {
    const { username } = req.params;
    const sql = 'SELECT id, task, done, updated FROM todo WHERE username = ? ORDER BY id DESC';
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// 2. CREATE: Add a new todo item
app.post('/api/todos', (req, res) => {
    const { username, task } = req.body;
    if (!username || !task) {
        return res.status(400).send({ message: 'Username and task are required' });
    }
    const sql = 'INSERT INTO todo (username, task) VALUES (?, ?)';
    db.query(sql, [username, task], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ id: result.insertId, username, task, done: 0, updated: new Date() });
    });
});

// 3. UPDATE: Toggle the 'done' status
app.put('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const { done } = req.body; 
    
    const sql = 'UPDATE todo SET done = ? WHERE id = ?';
    db.query(sql, [done, id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Todo not found' });
        }
        res.send({ message: 'Todo updated successfully' });
    });
});

// 4. DELETE: Remove a todo item
app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM todo WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Todo not found' });
        }
        res.send({ message: 'Todo deleted successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
