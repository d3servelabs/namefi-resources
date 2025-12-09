/**
 * EPP Connection Pool using generic-pool
 *
 * Internal module for managing pooled EPP connections with automatic
 * login/logout lifecycle and health checking.
 */
import {
  createPool,
  type Pool,
  type Options as PoolOptions,
} from 'generic-pool';
import {
  connectEpp,
  closeConnection,
  readFrame,
  type ConnectOptions,
  type EppConnection,
} from '../transport';

/**
 * Pool configuration options
 */
export interface EppPoolOptions {
  /** Minimum number of connections in the pool. Default: 0 */
  min?: number;
  /** Maximum number of connections in the pool. Default: 1 */
  max?: number;
  /** Maximum time (ms) to wait for a connection. Default: 30000 */
  acquireTimeoutMs?: number;
  /** Time (ms) a connection can be idle before being destroyed. Default: 30000 */
  idleTimeoutMs?: number;
  /** How often (ms) to check for idle connections. Default: 10000 */
  evictionRunIntervalMs?: number;
}

/**
 * A pooled connection that tracks login state
 */
export interface PooledConnection {
  conn: EppConnection;
  loggedIn: boolean;
}

/**
 * Options for creating a connection pool
 */
export interface CreatePoolOptions {
  connection: ConnectOptions;
  pool?: EppPoolOptions;
  /**
   * Called after connection is established to perform login.
   * Should return the login XML response or throw on failure.
   */
  onLogin?: (conn: EppConnection) => Promise<string>;
  /**
   * Called before connection is destroyed to perform logout.
   */
  onLogout?: (conn: EppConnection) => Promise<void>;
  /**
   * Called to validate a connection is still alive.
   * Should return true if connection is healthy.
   */
  onValidate?: (conn: EppConnection) => Promise<boolean>;
}

export type EppConnectionPool = Pool<PooledConnection>;

/**
 * Creates an EPP connection pool.
 *
 * The pool manages raw connections with optional login/logout lifecycle.
 * Use `pool.use()` to acquire a connection, execute operations, and auto-release.
 */
export function createEppConnectionPool(
  options: CreatePoolOptions,
): EppConnectionPool {
  const factory = {
    async create(): Promise<PooledConnection> {
      const conn = await connectEpp(options.connection);

      // Read initial greeting
      await readFrame(conn, { timeoutMs: 10_000 });

      // Perform login if handler provided
      let loggedIn = false;
      if (options.onLogin) {
        await options.onLogin(conn);
        loggedIn = true;
      }

      return { conn, loggedIn };
    },

    async destroy(pooled: PooledConnection): Promise<void> {
      // Perform logout if handler provided and connection is logged in
      if (
        options.onLogout &&
        pooled.loggedIn &&
        !pooled.conn.socket.destroyed
      ) {
        try {
          await options.onLogout(pooled.conn);
        } catch {
          // Best-effort logout
        }
      }
      closeConnection(pooled.conn);
    },

    async validate(pooled: PooledConnection): Promise<boolean> {
      const isDestroyed = pooled.conn.socket.destroyed;
      if (isDestroyed) {
        return false;
      }
      if (options.onValidate) {
        try {
          const result = await options.onValidate(pooled.conn);
          return result;
        } catch (err) {
          console.log('[POOL VALIDATE] onValidate threw:', err);
          return false;
        }
      }
      return true;
    },
  };

  const poolConfig: PoolOptions = {
    min: options.pool?.min ?? 1,
    max: options.pool?.max ?? 1,
    acquireTimeoutMillis: options.pool?.acquireTimeoutMs ?? 30_000,
    idleTimeoutMillis: options.pool?.idleTimeoutMs ?? 600_000,
    evictionRunIntervalMillis: options.pool?.evictionRunIntervalMs ?? 15_000,
    testOnBorrow: true,
    autostart: true,
    testOnReturn: true,
    fifo: true,
  };

  return createPool(factory, poolConfig);
}
