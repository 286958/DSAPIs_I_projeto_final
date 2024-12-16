const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const cors = require('cors'); // certifique-se de que o 'cors' foi importado

const app = express();
const PORT = 3000;
const SECRET_KEY = 'quero_cerveja'; // mantenha sua chave secreta segura

// configuração de middlewares
app.use(cors());  // middleware CORS para permitir requisições de diferentes origens
app.use(express.json()); // processa requisições com corpo em JSON
app.use(bodyParser.json()); // middleware para analisar o JSON (não necessário aqui, mas mantido para compatibilidade)

// conexão com o banco de dados
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',        
  password: '',       
  database: 'tododb',  
  waitForConnections: true,
  connectionLimit: 10,
});

const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // extrai o token do cabeçalho
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user; // adiciona informações do usuário à requisição
    next();
  });
};

// rota para registro de usuários
app.post('/auth/register', async (req, res) => {
  console.log('Conteúdo do body:', req.body);

  const { nome_usuario, senha } = req.body;

  if (!nome_usuario || !senha) {
    return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  }

  try {
    const hash = await bcrypt.hash(senha, 10); // criptografa a senha
    const sql = 'INSERT INTO usuarios (nome_usuario, senha) VALUES (?, ?)';
    const [result] = await pool.query(sql, [nome_usuario, hash]);

    res.status(201).json({ message: 'Usuário registrado com sucesso', id: result.insertId });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error.message);
    res.status(500).json({ error: 'Erro ao registrar usuário', details: error });
  }
});

// rota para login de usuários
app.post('/auth/login', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE nome_usuario = ?', [nome_usuario]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha inválida' });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    res.status(500).json({ message: 'Erro ao fazer login', details: error });
  }
});

// rota para criar uma nova tarefa
app.post('/tasks', authenticateJWT, async (req, res) => {
  const { titulo, descricao } = req.body;
  const { id: userId } = req.user;

  try {
    const sql = 'INSERT INTO tarefas (titulo, descricao, id_usuario) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [titulo, descricao, userId]);

    res.status(201).json({ id: result.insertId, titulo, descricao, status: 'pendente' });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error.message);
    res.status(500).json({ message: 'Erro ao criar tarefa', details: error });
  }
});

// rota para buscar tarefas do usuário
app.get('/tasks', authenticateJWT, async (req, res) => {
  const { id: userId } = req.user;

  try {
    const sql = 'SELECT id, titulo, descricao, status FROM tarefas WHERE id_usuario = ?';
    const [rows] = await pool.query(sql, [userId]);

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error.message);
    res.status(500).json({ message: 'Erro ao buscar tarefas', details: error });
  }
});

// rota para atualizar uma tarefa
app.put('/tasks/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, status } = req.body;
  const { id: userId } = req.user;

  try {
    const sql = 'UPDATE tarefas SET titulo = ?, descricao = ?, status = ? WHERE id = ? AND id_usuario = ?';
    const [result] = await pool.query(sql, [titulo, descricao, status, id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    res.json({ message: 'Tarefa atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error.message);
    res.status(500).json({ message: 'Erro ao atualizar tarefa', details: error });
  }
});

// rota para deletar uma tarefa
app.delete('/tasks/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  try {
    const sql = 'DELETE FROM tarefas WHERE id = ? AND id_usuario = ?';
    const [result] = await pool.query(sql, [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    res.json({ message: 'Tarefa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error.message);
    res.status(500).json({ message: 'Erro ao deletar tarefa', details: error });
  }
});

// iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

