import type { z } from 'zod';
import type {
  AnyProcedure,
  MutationProcedure,
  QueryProcedure,
  Router,
  RouterRecord,
} from '@trpc/server/unstable-core-do-not-import';

/**
 * Type-only contract-first tRPC router infrastructure.
 *
 * A "contract" is a plain object describing every procedure on a router as
 * `{ type: 'query' | 'mutation', input: ZodSchema, output: ZodSchema }`,
 * with optional **nested** sub-contracts for sub-routers:
 *
 *   const myContract = {
 *     getThing: { type: 'query',    input: ..., output: ... },
 *     setThing: { type: 'mutation', input: ..., output: ... },
 *     admin: {
 *       deleteThing: { type: 'mutation', input: ..., output: ... },
 *       listAll:     { type: 'query',    input: ..., output: ... },
 *     },
 *   } as const satisfies RouterContract;
 *
 * The contract is **only** about wire shape — it does not know or care
 * whether a procedure is `publicProcedure`, `protectedProcedure`, wrapped
 * with custom middleware, etc. Auth and middleware decisions are made at
 * the procedure-definition site in the router file.
 *
 * This file lives in `@namefi-astra/common` so the **types** can be shared
 * with the frontend (or any other consumer). The runtime helper that
 * actually constructs a tRPC router from procedures matching the contract
 * lives in `apps/backend/src/trpc/contract.ts`, where it can carry the
 * backend's `TrpcMeta` type.
 */

// ---------------------------------------------------------------------------
// Contract shape
// ---------------------------------------------------------------------------

export type ContractType = 'query' | 'mutation';

export type ProcedureContract = {
  readonly type: ContractType;
  readonly input: z.ZodTypeAny;
  readonly output: z.ZodTypeAny;
};

/**
 * Each entry of a `RouterContract` is either a leaf procedure contract or
 * another nested router contract. Nesting is recursive — there is no depth
 * limit other than what TypeScript can resolve.
 */
export type RouterContract = {
  readonly [key: string]: ProcedureContract | RouterContract;
};

// ---------------------------------------------------------------------------
// Procedure / record / router type derivation
// ---------------------------------------------------------------------------

/**
 * The tRPC procedure type derived from a single leaf contract entry.
 *
 * - `BuiltProcedureDef.input` is `z.input<C['input']>` — the PRE-parse shape
 *   — because that is the type clients send over the wire (and what
 *   `inferRouterInputs<AppRouter>` exposes to consumers). For a branded zod
 *   schema, `z.input` is the unbranded base type, which lets clients keep
 *   passing plain `string`s where the server brands them after parsing.
 *
 * - `BuiltProcedureDef.output` is `z.output<C['output']>` — the POST-parse
 *   shape — because that is what the client receives.
 *
 * - `BuiltProcedureDef.meta` is plumbed through as the `TMeta` generic so
 *   per-procedure `.meta(...)` calls keep their proper typing instead of
 *   collapsing to `object` / `unknown`. Pass the actual meta type from the
 *   tRPC instance (e.g. `TrpcMeta` exported from `apps/backend/src/trpc/base.ts`).
 */
export type ProcedureFor<
  C extends ProcedureContract,
  TMeta = unknown,
> = C['type'] extends 'query'
  ? QueryProcedure<{
      meta: TMeta;
      input: z.input<C['input']>;
      output: z.output<C['output']>;
    }>
  : MutationProcedure<{
      meta: TMeta;
      input: z.input<C['input']>;
      output: z.output<C['output']>;
    }>;

/**
 * The tRPC router record (procedures keyed by name) derived from a contract.
 * Recursively descends into nested contracts so a sub-contract becomes a
 * `RouterRecord` (which `t.router` accepts as a sub-router).
 */
export type ContractRouterRecord<
  TContract extends RouterContract,
  TMeta = unknown,
> = {
  [K in keyof TContract]: TContract[K] extends ProcedureContract
    ? ProcedureFor<TContract[K], TMeta>
    : TContract[K] extends RouterContract
      ? ContractRouterRecord<TContract[K], TMeta>
      : never;
};

/**
 * The full tRPC `Router` type derived from a contract.
 *
 * Useful when you want to share an `AppRouter`-style type with the frontend
 * (for `inferRouterInputs<...>` / `inferRouterOutputs<...>`) **without**
 * importing the backend's actual router instance. The frontend can import
 * just the contract from `@namefi-astra/common` and synthesize the router
 * type:
 *
 *   import type { ContractRouter } from '@namefi-astra/common/trpc-contract';
 *   import type { dnsRecordsContract } from '@namefi-astra/common/dns-records-contract';
 *   import type { inferRouterInputs } from '@trpc/server';
 *
 *   type DnsRecordsRouter = ContractRouter<typeof dnsRecordsContract>;
 *   type Inputs = inferRouterInputs<DnsRecordsRouter>;
 *
 * `inferRouterInputs` only walks `_def.record`, so the synthetic router type
 * we construct here is structurally compatible even though we never actually
 * instantiate a real router on the frontend.
 */
export type ContractRouter<
  TContract extends RouterContract,
  TMeta = unknown,
> = Router<
  // We don't know the consumer's ctx / errorShape / transformer at the
  // contract level — they're irrelevant to input/output inference. `any` is
  // safe here because `inferRouterInputs` / `inferRouterOutputs` only read
  // `_def.record` (and the transformer flag, which we don't use for input).
  // biome-ignore lint/suspicious/noExplicitAny: see comment above
  { ctx: any; meta: TMeta; errorShape: any; transformer: any },
  // Cast through `RouterRecord` so the recursive ContractRouterRecord
  // satisfies tRPC's recursive `RouterRecord` constraint.
  ContractRouterRecord<TContract, TMeta> & RouterRecord
>;

// ---------------------------------------------------------------------------
// Inference helpers (read directly off a contract, not a router)
// ---------------------------------------------------------------------------

/**
 * Infer the wire-input map for a router contract: `{ procName: wireInput }`.
 * Recurses into nested router contracts. Uses `z.input` so the shape matches
 * what clients send (pre-parse).
 */
export type InferContractInputs<TContract extends RouterContract> = {
  [K in keyof TContract]: TContract[K] extends ProcedureContract
    ? z.input<TContract[K]['input']>
    : TContract[K] extends RouterContract
      ? InferContractInputs<TContract[K]>
      : never;
};

/**
 * Infer the wire-output map for a router contract: `{ procName: wireOutput }`.
 * Recurses into nested router contracts. Uses `z.output` so the shape
 * matches what clients receive (post-parse).
 */
export type InferContractOutputs<TContract extends RouterContract> = {
  [K in keyof TContract]: TContract[K] extends ProcedureContract
    ? z.output<TContract[K]['output']>
    : TContract[K] extends RouterContract
      ? InferContractOutputs<TContract[K]>
      : never;
};

// ---------------------------------------------------------------------------
// Re-export tRPC procedure types so consumers don't have to reach into
// `@trpc/server/unstable-core-do-not-import`.
// ---------------------------------------------------------------------------

export type { AnyProcedure, RouterRecord };
