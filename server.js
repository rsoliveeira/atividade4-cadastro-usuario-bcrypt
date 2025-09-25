const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');

app.get('/', (req,res) => {
    res.send(('Servidor de upload funcionando'));
});

app.listen(port, ()=> {
    console.log(`Servidor esta rodando na porta: ${port}`);
});

const storage = multer.diskStorage({
    destination: function(req,file,cd){
        cd(null,'uploads/');
    },
    filename: function(req,file,cd){
        cd(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage
})

app.post('/upload', upload.single('meuArquivo'), (req,res)=>{
    if(!req.file){
        return res.status(400).send('Nenhum arquivo enviado');
    }

    res.send(`Arquivo ${req.file.filename} enviado com sucesso`);
});