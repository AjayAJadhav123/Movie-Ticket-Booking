const jwt = require('jsonwebtoken');
const NodeRSA = require('node-rsa');
const { verifyToken } = require('@clerk/express');

async function test() {
  console.log('Generating RSA key pair...');
  const key = new NodeRSA({b: 2048});
  const privateKey = key.exportKey('pkcs1-private-pem');
  const publicKey = key.exportKey('pkcs8-public-pem');
  
  console.log('Public Key:\n', publicKey);
  
  const payload = {
    sub: 'user_3HxvplFV33psRj5hNMuoHOb7uNE',
    iss: 'https://peaceful-teal-4875.clerk.accounts.dev',
    azp: 'http://localhost:5174',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60)
  };
  
  console.log('Signing token...');
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  console.log('Token:', token);
  
  console.log('Verifying token with Clerk SDK using jwtKey...');
  try {
    const auth = await verifyToken(token, {
      jwtKey: publicKey,
      authorizedParties: ['http://localhost:5174']
    });
    console.log('SUCCESS! Auth object:', auth);
  } catch (err) {
    console.error('FAILED to verify token!', err);
  }
}

test();
