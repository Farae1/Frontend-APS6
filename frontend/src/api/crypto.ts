// Encrypts the base minister's password in the browser before it is sent:
// RSA-OAEP (SHA-256) with the API's public key, over "nonce:password". The
// nonce is valid once, so a captured request can't be replayed.

const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
const toBase64 = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)))

export async function encryptPassword(publicKey: string, nonce: string, password: string): Promise<string> {
  const key = await crypto.subtle.importKey('spki', fromBase64(publicKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, [
    'encrypt',
  ])
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(`${nonce}:${password}`))
  return toBase64(encrypted)
}
