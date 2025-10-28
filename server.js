const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // Módulo nativo para manipulação de pastas
const bcrypt = require('bcryptjs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

// modelo em memória (Atv 4)
const { addUser, findByUsername, listUsers } = require('./models/userModel');

// Função para criar o diretório de upload, se ele não existir.
const createUploadDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Diretório ${dir} criado automaticamente.`);
  }
};

// Função para validar o tipo de arquivo (fileFilter)
// Permite apenas JPG ou PNG.
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo inválido. Apenas JPG e PNG são permitidos.'), false);
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB em bytes

app.get('/', (req, res) => {
  res.send('Servidor funcionando (upload e cadastro)');
});


const storage = multer.diskStorage({
  destination: function (req, file, cd) {
    const uploadDiretorio = 'uploads/';
    createUploadDirectory(uploadDiretorio); // <--- Chamada para verificar/criar pasta
    cd(null, uploadDiretorio); // <--- Usa a constante local 'uploadDir'
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter, // <--- Aplica o filtro de tipo
  limits: {          // <--- Aplica os limites de tamanho e quantidade
    fileSize: MAX_FILE_SIZE,
    files: 10, // [ALTERAÇÃO MINHA] permite até 10 arquivos
  },
});

app.post('/upload', (req, res) => {
  // [ALTERAÇÃO MINHA] single -> array('meusArquivos', 10)
  upload.array('meusArquivos', 10)(req, res, function (err) { // Chama 'upload.array' (Middleware) e passa uma função de callback (err)
    if (err instanceof multer.MulterError) { // Verifica se o erro é uma instância de erro do Multer (limits)
      return res.status(400).send({ 
        message: `Erro do Multer: ${err.code}.`,
        detail: 'Verifique o tamanho ou a quantidade de arquivos.',
      });
    }
    if (err) {
      return res.status(400).send({ message: err.message });
    }

    // [ALTERAÇÃO MINHA] Ajuste de single -> múltiplos
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).send('Nenhum arquivo enviado');
    }

   // [ALTERAÇÃO MINHA] Resposta listando todos os arquivos enviados
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

// ATIVIDADE 4: CADASTRO DE USUÁRIO COM BCRYPT 
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

    // gera o hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

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

// rota de debug para ver usuários (sem hash)
app.get('/_debug/users', (req, res) => {
  return res.json(listUsers());
});

app.listen(port, () => {
  console.log(`Servidor esta rodando na porta: ${port}`);
});
