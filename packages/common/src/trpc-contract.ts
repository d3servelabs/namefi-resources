import type { z } from 'zod';
import type {
  AnyProcedure,
  BuiltRouter,
  MutationProcedure,
  QueryProcedure,
  RouterRecord,
  SubscriptionProcedure,
} from '@trpc/server/unstable-core-do-not-import';

/**
 * Type-only contract-first tRPC router infrastructure.
 *
 * A "contract" is a plain object describing every procedure on a router as
 * `{ type: 'query' | 'mutation' | 'subscription', input: ZodSchema, output: ZodSchema }`,
 * with optional **nested** sub-contracts for sub-routers:
 *
 *   const myContract = {
 *     getThing: { type: 'query',        input: ..., output: ... },
 *     setThing: { type: 'mutation',     input: ..., output: ... },
 *     liveFeed: { type: 'subscription', input: ..., output: ... },
 *     admin: {
 *       deleteThing: { type: 'mutation', input: ..., output: ... },
 *       listAll:     { type: 'query',    input: ..., output: ... },
 *     },
 *   } as const satisfies RouterContract;
 *
 * For subscriptions, `output` describes the shape of **each event** the
 * resolver yields (for `async function*` subscriptions in tRPC v11) or the
 * inner value of the observable (for the legacy subscription style). It is
 * not the `AsyncIterable<...>` wrapper itself.
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

export type ContractType = 'query' | 'mutation' | 'subscription';

export type ProcedureContract = {
  readonly type: ContractType;
  readonly input: z.ZodTypeAny;
  /**
   * For `query` and `mutation`, this is the response shape. For
   * `subscription`, this is the shape of **each event** the resolver
   * yields/emits — not the `AsyncIterable<...>` / observable wrapper.
   */
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
 * - `BuiltProcedureDef.output` for `query` / `mutation` is
 *   `z.output<C['output']>` (the POST-parse response shape). For
 *   `subscription`, it is `AsyncIterable<z.output<C['output']>, any, any>`
 *   — tRPC v11 subscriptions use an `async function*` resolver whose
 *   inferred return type is the full `AsyncIterable<Event>`, and that is
 *   what tRPC stores on the procedure def. Wrapping here keeps the
 *   contract-derived procedure type structurally equal to what the backend
 *   builder actually produces.
 *
 *   Implementation note for subscriptions: do **not** call `.output(...)`
 *   on the procedure chain. In tRPC v11, `.output()` on a subscription
 *   expects the full `AsyncIterable<Event>` type and fails with
 *   `TypeError<'Subscription output could not be inferred'>` if a plain
 *   per-event schema is passed. Just declare the event shape in the
 *   contract and let `async function*` inference carry it through; tRPC
 *   will still serialize the yielded values correctly on the wire.
 *
 * - `BuiltProcedureDef.meta` is plumbed through as the `TMeta` generic so
 *   per-procedure `.meta(...)` calls keep their proper typing instead of
 *   collapsing to `object` / `unknown`. Pass the actual meta type from the
 *   tRPC instance (e.g. `TrpcMeta` exported from `apps/backend/src/trpc/base.ts`).
 *
 * Dispatches on `C['type']` to pick `QueryProcedure`, `MutationProcedure`,
 * or `SubscriptionProcedure` from tRPC's procedure type zoo. A contract
 * with an unknown `type` falls through to `never`, which surfaces as a
 * very visible compile error at the implementation site.
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
  : C['type'] extends 'mutation'
    ? MutationProcedure<{
        meta: TMeta;
        input: z.input<C['input']>;
        output: z.output<C['output']>;
      }>
    : C['type'] extends 'subscription'
      ? SubscriptionProcedure<{
          meta: TMeta;
          input: z.input<C['input']>;
          // biome-ignore lint/suspicious/noExplicitAny: match tRPC's subscription() generic bounds, which use `any` for the AsyncIterable's $Return / $Next parameters.
          output: AsyncIterable<z.output<C['output']>, any, any>;
        }>
      : never;

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
 * The full tRPC `BuiltRouter` type derived from a contract.
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
 * We use tRPC's `BuiltRouter<TRoot, TRecord> = Router<TRoot, TRecord> & TRecord`
 * (rather than the plain `Router<...>` interface) so the result is
 * structurally assignable to `RouterRecord` as well. That matters when a
 * `ContractRouter<...>` is plugged *into* another router's `_def.record`
 * as a sub-router — e.g. when the frontend splices contract-derived types
 * into an `AppRouter` override — since tRPC's inference helpers check each
 * record entry with `$Value extends RouterRecord` and a BuiltRouter passes
 * that check thanks to the TRecord intersection.
 */
export type ContractRouter<
  TContract extends RouterContract,
  TMeta = unknown,
> = BuiltRouter<
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
