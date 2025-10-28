const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // Módulo nativo para manipulação de pastas
const bcrypt = require('bcryptjs');

// servir arquivos estáticos (frontend) a partir de /public
app.use(express.static(path.join(__dirname, 'public')));

// habilitar JSON no corpo das requisições
app.use(express.json());

// modelo em memória (Atv 4)
const { addUser, findByUsername, listUsers } = require('./models/userModel');

// util: criar pasta uploads/ se não existir
const createUploadDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Diretório ${dir} criado automaticamente.`);
  }
};

// filtro de tipos (apenas JPG/PNG)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas JPG e PNG são permitidos.'), false);
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// rota simples de saúde
app.get('/', (req, res) => {
  res.send('Servidor funcionando (upload e cadastro)');
});

// ====== UPLOAD MÚLTIPLO ======
const storage = multer.diskStorage({
  destination: function (req, file, cd) {
    const uploadDiretorio = 'uploads/';
    createUploadDirectory(uploadDiretorio);
    cd(null, uploadDiretorio);
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // [ALTERAÇÃO MINHA] permite até 10 arquivos
  },
});

app.post('/upload', (req, res) => {
  // [ALTERAÇÃO MINHA] single -> array('meusArquivos', 10)
  upload.array('meusArquivos', 10)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).send({
        message: `Erro do Multer: ${err.code}.`,
        detail: 'Verifique o tamanho ou a quantidade de arquivos.',
      });
    }
    if (err) {
      return res.status(400).send({ message: err.message });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).send('Nenhum arquivo enviado');
    }

    const arquivos = files.map((file) => ({
      nomeOriginal: file.originalname,
      nomeSalvo: file.filename,
      tipo: file.mimetype,
      tamanho: file.size,
    }));

    return res.status(201).send({
      message: `Enviado(s) ${arquivos.length} arquivo(s) com sucesso`,
      arquivos,
    });
  });
});

// ====== ATIVIDADE 4: CADASTRO DE USUÁRIO COM BCRYPT ======
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'username, email e password são obrigatórios.' });
    }

    // verifica duplicidade por username
    const existente = findByUsername(username);
    if (existente) {
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    // gera o hash da senha (saltRounds = 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // persiste no "modelo" em memória
    const novo = addUser({ username, email, passwordHash });

    // retorna sem expor o hash
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      user: { id: novo.id, username: novo.username, email: novo.email },
    });
  } catch (e) {
    console.error('Erro no /register:', e);
    return res.status(500).json({ message: 'Erro interno ao cadastrar usuário.' });
  }
});

// (opcional) rota de debug para ver usuários (sem hash)
app.get('/_debug/users', (req, res) => {
  return res.json(listUsers());
});

// iniciar servidor (mover para o final é boa prática)
app.listen(port, () => {
  console.log(`Servidor esta rodando na porta: ${port}`);
});
