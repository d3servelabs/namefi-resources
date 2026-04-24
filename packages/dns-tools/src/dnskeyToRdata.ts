/**
 * Construct DNSKEY RDATA wire format
 *  2 bytes: Flags(Big Endian)
 *  1 byte: Protocol
 *  1 byte: Algorithm
 *  X bytes: Public key (X is the length of the public key based on the algorithm)
 *
 *  ```mermaid
 *  packet-beta
 *     0-15: Flags(Big Endian)
 *    16-23: Protocol
 *    24-31: Algorithm
 *    32-: Public key
 *  ```
 */

export function dnskeyToRdata(
  flags: number,
  protocol: number,
  algorithm: number,
  publicKey: string,
): Uint8Array {
  if (!Number.isInteger(flags) || flags < 0 || flags > 0xffff) {
    throw new Error('Flags must be an integer between 0 and 65535');
  }
  if (!Number.isInteger(protocol) || protocol < 0 || protocol > 0xff) {
    throw new Error('Protocol must be an integer between 0 and 255');
  }
  if (!Number.isInteger(algorithm) || algorithm < 0 || algorithm > 0xff) {
    throw new Error('Algorithm must be an integer between 0 and 255');
  }

  const rdata = new Uint8Array(4);
  const view = new DataView(rdata.buffer);
  view.setUint16(0, flags); // 2 bytes, big-endian by default
  rdata[2] = protocol; // 1 byte
  rdata[3] = algorithm; // 1 byte

  const publicKeyBytes = _base64ToBytes(publicKey);
  return _concatBytes(rdata, publicKeyBytes);
}
/**
 * Base64-decodes the public key string
 */
function _base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(b64.replace(/\s+/g, ''), 'base64'));
}

function _concatBytes(...parts: ReadonlyArray<Uint8Array>): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}
