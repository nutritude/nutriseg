const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

function base64url(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken() {
    const key = JSON.parse(fs.readFileSync('./src/infrastructure/database/firebase-key.json', 'utf8'));
    
    // Certificando que a chave tem os headers corretos
    const privateKey = key.private_key;

    const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64');
    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = Buffer.from(JSON.stringify({
        iss: key.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    })).toString('base64');

    const signatureInput = `${base64url(jwtHeader)}.${base64url(jwtClaimSet)}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    signer.end();
    const signature = signer.sign(privateKey, 'base64');
    const jwt = `${signatureInput}.${base64url(signature)}`;

    const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;

    const options = {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`OAuth Error ${res.statusCode}: ${body}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

getAccessToken()
    .then(token => {
        console.log('✅ SUCESSO! A chave privada é VÁLIDA.');
        console.log('Access Token obtido (primeiros 20 caracteres):', token.access_token.substring(0, 20));
    })
    .catch(err => {
        console.error('❌ FALHA: A chave privada continua sendo rejeitada pelo Google.');
        console.error(err.message);
        if (err.message.includes('invalid_grant')) {
            console.error('Dica: Isso geralmente significa que os bits da chave foram alterados ou os campos iss/aud estão incorretos.');
        }
    });
