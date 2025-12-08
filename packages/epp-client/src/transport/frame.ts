import net from 'node:net';
import tls from 'node:tls';
import type { EppFrame, EppConnectionOptions } from '../protocol/core/types';

export interface EppConnection {
  socket: net.Socket | tls.TLSSocket;
  options: EppConnectionOptions;
}

export interface ConnectOptions extends EppConnectionOptions {
  timeoutMs?: number;
  tlsOptions?: tls.ConnectionOptions;
}

export async function connectEpp(
  options: ConnectOptions,
): Promise<EppConnection> {
  const {
    host,
    port = 700,
    tls: useTls,
    timeoutMs,
    tlsOptions,
    onConnectionEnd,
  } = options;

  const socket = await new Promise<net.Socket | tls.TLSSocket>(
    (resolve, reject) => {
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        socket.off('error', onError);
        if (timeoutId) clearTimeout(timeoutId);
      };

      const timeoutId =
        timeoutMs && timeoutMs > 0
          ? setTimeout(() => {
              cleanup();
              socket.destroy();
              reject(new Error(`EPP connect timeout after ${timeoutMs}ms`));
            }, timeoutMs)
          : undefined;

      const socket: net.Socket | tls.TLSSocket = useTls
        ? tls.connect({ host, port, ...tlsOptions }, () => {
            cleanup();
            resolve(socket);
          })
        : net.createConnection({ host, port }, () => {
            cleanup();
            resolve(socket);
          });

      socket.once('error', onError);
      if (onConnectionEnd) {
        socket.on('end', onConnectionEnd);
      }
    },
  );

  return { socket, options };
}

export function encodeFrame(xml: string): EppFrame {
  const xmlBuf = Buffer.from(xml, 'utf8');
  const length = xmlBuf.length + 4; // length prefix includes itself

  return {
    length,
    xml,
  };
}

export async function sendFrame(
  conn: EppConnection,
  xml: string,
): Promise<void> {
  const { length } = encodeFrame(xml);
  const xmlBuf = Buffer.from(xml, 'utf8');
  const frame = Buffer.alloc(length);
  frame.writeUInt32BE(length, 0);
  xmlBuf.copy(frame, 4);

  await new Promise<void>((resolve, reject) => {
    conn.socket.write(frame, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function readFrame(
  conn: EppConnection,
  opts: { timeoutMs?: number } = {},
): Promise<string> {
  const { socket } = conn;
  let buffer = Buffer.alloc(0);
  let expectedLength: number | null = null;

  return new Promise<string>((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);

      if (expectedLength === null && buffer.length >= 4) {
        expectedLength = buffer.readUInt32BE(0);
      }

      if (expectedLength !== null && buffer.length >= expectedLength) {
        const xmlBuf = buffer.slice(4, expectedLength);
        cleanup();
        resolve(xmlBuf.toString('utf8'));
      }
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const onClose = () => {
      cleanup();
      reject(new Error('Socket closed before full frame was read'));
    };

    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const timeoutId =
      opts.timeoutMs && opts.timeoutMs > 0
        ? setTimeout(() => {
            cleanup();
            reject(new Error(`EPP read timeout after ${opts.timeoutMs}ms`));
          }, opts.timeoutMs)
        : undefined;

    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('close', onClose);
  });
}

export function closeConnection(conn: EppConnection): void {
  if (conn.socket.destroyed) return;
  conn.socket.end();
}
