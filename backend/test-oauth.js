const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

async function getAccessToken() {
    const key = JSON.parse(fs.readFileSync('./src/infrastructure/database/firebase-key.json', 'utf8'));
    
    const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64');
    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = Buffer.from(JSON.stringify({
        iss: key.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    })).toString('base64');

    const signatureInput = `${jwtHeader}.${jwtClaimSet}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    signer.end();
    const signature = signer.sign(key.private_key, 'base64');

    const jwt = `${signatureInput}.${signature}`;

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
    .then(token => console.log('✅ Token gerado com sucesso! O problema não é a chave em si.'))
    .catch(err => {
        console.error('❌ Erro ao validar chave no OAuth do Google:');
        console.error(err.message);
    });
