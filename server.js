const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');

const fs = require('fs'); // Módulo nativo para manipulação de pastas


const createUploadDirectory = (dir) => { // Função para criar o diretório de upload, se ele não existir.
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Diretório ${dir} criado automaticamente.`);
    }
};

const fileFilter = (req, file, cb) => { // Função para validar o tipo de arquivo (fileFilter).
    // Permite apenas JPG ou PNG.
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true); 
    } else {
        cb(new Error('Tipo de arquivo inválido. Apenas JPG e PNG são permitidos.'), false);
    }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB em bytes

app.get('/', (req,res) => {
    res.send(('Servidor de upload funcionando'));
});

app.listen(port, ()=> {
    console.log(`Servidor esta rodando na porta: ${port}`);
});

const storage = multer.diskStorage({
    destination: function(req,file,cd){
        const uploadDiretorio = 'uploads/';
        createUploadDirectory(uploadDiretorio); // <--- Chamada para verificar/criar pasta
        cd(null, uploadDiretorio); // <--- Usa a constante local 'uploadDir'
    },
    filename: function(req,file,cd){
        cd(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: fileFilter, // <--- Aplica o filtro de tipo
    limits: {              // <--- Aplica os limites de tamanho e quantidade
        fileSize: MAX_FILE_SIZE, 
        files: 1 
    }
});

app.post('/upload', (req, res) => {
    
    upload.single('meuArquivo')(req, res, function (err) { // Chama 'upload.single' (Middleware) e passa uma função de callback (err)
        
        if (err instanceof multer.MulterError) { // Verifica se o erro é uma instância de erro do Multer (limits)
            return res.status(400).send({ 
                message: `Erro do Multer: ${err.code}.`,
                detail: "Verifique o tamanho ou a quantidade de arquivos."
            });
        } 
        
        if (err) { // Captura o erro customizado do fileFilter ou outros erros genéricos.
            return res.status(400).send({ message: err.message });
        }

        
        if (!req.file){ // Lógica de Sucesso
            return res.status(400).send('Nenhum arquivo enviado');
        }

        res.send(`Arquivo ${req.file.filename} enviado com sucesso`);
    });
});