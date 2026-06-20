/**
 * ipfsService.js
 *
 * Uploads JSON metadata to IPFS via Pinata using JWT auth.
 * Uses native https — no SDK dependency, no scope issues.
 */

const https = require('https');

/**
 * Upload a JSON metadata object to IPFS via Pinata.
 * @param {object} metadata - The metadata object to pin.
 * @returns {Promise<string>} The IPFS CID of the pinned content.
 * @throws {Error} If the upload fails.
 */
async function uploadMetadata(metadata) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error('PINATA_JWT is not set in .env');

  const body = JSON.stringify({
    pinataContent: metadata,
    pinataMetadata: { name: `promptfi-${Date.now()}` },
  });

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.pinata.cloud',
      path:     '/pinning/pinJSONToIPFS',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization':  `Bearer ${jwt}`,
      },
    };

    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode === 200 && json.IpfsHash) {
            resolve(json.IpfsHash);
          } else {
            reject(new Error(
              `Pinata error ${res.statusCode}: ${json?.error?.details || json?.error?.reason || raw}`
            ));
          }
        } catch (e) {
          reject(new Error(`Pinata response parse error: ${raw}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Pinata request failed: ${err.message}`)));
    req.write(body);
    req.end();
  });
}

/**
 * Fetch JSON metadata from IPFS via the public Pinata gateway.
 * @param {string} ipfsHash - The CID to fetch.
 * @returns {Promise<object>} Parsed JSON metadata.
 */
async function fetchMetadata(ipfsHash) {
  return new Promise((resolve, reject) => {
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`Failed to parse IPFS content: ${raw.slice(0, 200)}`));
        }
      });
    }).on('error', (err) => reject(new Error(`IPFS fetch failed: ${err.message}`)));
  });
}

module.exports = { uploadMetadata, fetchMetadata };
