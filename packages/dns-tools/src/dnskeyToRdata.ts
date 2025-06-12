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
): Buffer {
  const rdata = Buffer.alloc(4);
  rdata.writeUInt16BE(flags, 0); // 2 bytes
  rdata.writeUInt8(protocol, 2); // 1 byte
  rdata.writeUInt8(algorithm, 3); // 1 byte

  const pubkeyBuf = _base64ToBuffer(publicKey);
  return Buffer.concat([rdata, pubkeyBuf]);
}
/**
 * Base64-decodes the public key string
 */
function _base64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64.replace(/\s+/g, ''), 'base64');
}
