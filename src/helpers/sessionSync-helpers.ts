import * as crypto from 'node:crypto';
import { rm } from 'fs-extra';
import AdmZip from 'adm-zip';
import { userDataPath } from '../environment-remote';
import { SessionsData } from '../models/Sessions';

const debug = require('../preload-safe-debug')(
  'Ferdium:App:SessionSync-helpers',
);

const partitionsPath = userDataPath('Partitions');

// Function to decrypt data using AES
function decryptData(encryptedData: string, key: Buffer | crypto.CipherKey) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    key,
    Buffer.alloc(16),
  ); // AES-256 with CBC mode
  let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');
  return decryptedData;
}

// Function to encrypt data using AES
function encryptData(data: string, key: crypto.CipherKey) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16)); // AES-256 with CBC mode
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}

export async function handleReceiveFile(
  data: { encryptedChunks: any; encryptedKey: any },
  privateKey: crypto.RsaPrivateKey | crypto.KeyLike,
) {
  const { encryptedChunks, encryptedKey } = data;

  // Decrypt the AES key using the private key
  const decryptedKey = crypto.privateDecrypt(privateKey, encryptedKey);

  debug('Decrypted key:', decryptedKey);

  // Decrypt each chunk using the decrypted AES key
  const decryptedChunks = encryptedChunks.map((chunk: any) =>
    decryptData(chunk, decryptedKey),
  );

  // Concatenate the decrypted chunks
  const jsonData = decryptedChunks.join('');

  // Parse the JSON string
  const decryptedData = JSON.parse(jsonData);

  debug(decryptedData);

  // Decode base64 buffer
  const base64Buffer = decryptedData.buffer;
  const buffer = Buffer.from(base64Buffer, 'base64');

  await rm(partitionsPath, { recursive: true, force: true });

  // Extract to path
  const zip = new AdmZip(buffer);
  zip.extractAllTo(partitionsPath, true);
}

export function handleReadyToSend(
  dataToSend: SessionsData,
  publicKey: crypto.KeyLike | crypto.RsaPublicKey,
) {
  // Convert buffer to base64 string
  const base64Buffer = dataToSend.buffer.toString('base64');

  // Create an object to send with base64 buffer
  const objToSend = {
    ...dataToSend,
    buffer: base64Buffer,
  };

  debug('Original data:', JSON.stringify(objToSend));

  const chunkSize = 1024; // Adjust based on your requirements

  // Convert the object to a JSON string
  const jsonData = JSON.stringify(objToSend);

  // Split the JSON string into chunks
  const chunks: string[] = [];
  for (let i = 0; i < jsonData.length; i += chunkSize) {
    chunks.push(jsonData.slice(i, i + chunkSize));
  }

  // Encrypt each chunk
  const aesKey = crypto.randomBytes(32); // AES-256 key
  const encryptedChunks = chunks.map(chunk => encryptData(chunk, aesKey));

  // Encrypt the AES key with the public key
  const encryptedKey = crypto.publicEncrypt(publicKey, aesKey);

  return { encryptedChunks, encryptedKey };
}
