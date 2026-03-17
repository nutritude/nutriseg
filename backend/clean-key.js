const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'src/infrastructure/database/firebase-key.json');
const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

// Limpa a private_key de espaços indesejados (frequentemente introduzidos por cópia/cola de terminais ou OCR)
if (key.private_key) {
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";
    
    let content = key.private_key
        .replace(header, '')
        .replace(footer, '')
        .replace(/\s/g, ''); // Remove TODOS os espaços e quebras de linha internos
    
    // Reconstrói com quebras de linha a cada 64 caracteres (padrão PEM) ou apenas deixa linear
    // O Node aceita linear desde que tenha os headers.
    key.private_key = `${header}\n${content}\n${footer}`;
}

fs.writeFileSync(keyPath, JSON.stringify(key, null, 2));
console.log('✅ Chave privada limpa de espaços internos.');
