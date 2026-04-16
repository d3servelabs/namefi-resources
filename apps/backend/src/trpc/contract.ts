import type {
  ContractRouterRecord,
  RouterContract,
} from '@namefi-astra/common/trpc-contract';

import { createTRPCRouter, type TrpcMeta } from './base';

/**
 * Backend runtime side of the contract-first tRPC router infrastructure.
 *
 * The **types** (`ProcedureContract`, `RouterContract`,
 * `ContractRouterRecord<TContract, TMeta>`, `ProcedureFor`,
 * `ContractRouter`, `InferContractInputs`, `InferContractOutputs`) live in
 * `@namefi-astra/common/trpc-contract` so the same contract types can be
 * consumed by the frontend (or any other package).
 *
 * What remains here is the small piece that genuinely needs to live in
 * the backend:
 *
 * 1. The runtime `createContractTRPCRouter` factory, which has to call
 *    `t.router(...)` (= `createTRPCRouter` from `./base.ts`).
 * 2. Currying the contract types with the backend's `TrpcMeta` so the
 *    derived `QueryProcedure` / `MutationProcedure` types carry the actual
 *    meta type instead of `unknown`.
 *
 * Re-exports of the contract types are provided here for callers that
 * already import from `'../contract'`; new code can also import the types
 * directly from `@namefi-astra/common/trpc-contract`.
 */

export type {
  ContractRouter,
  ContractRouterRecord,
  ContractType,
  InferContractInputs,
  InferContractOutputs,
  ProcedureContract,
  ProcedureFor,
  RouterContract,
} from '@namefi-astra/common/trpc-contract';

/**
 * Build a tRPC router whose procedures are statically checked against a
 * contract. This is `createTRPCRouter` (i.e. `t.router`) with two extra
 * generic parameters that lock the procedures down to *exactly* the keys
 * declared in the contract.
 *
 * Use it like:
 *
 *   const myRouter = createContractTRPCRouter<typeof myContract>({
 *     procName: protectedProcedure
 *       .input(myContract.procName.input)
 *       .output(myContract.procName.output)
 *       .query(...),
 *     // ...every other key in myContract...
 *   });
 *
 * Compile errors fire on:
 * - **Missing key** — a contract entry with no matching procedure.
 * - **Extra key** — a procedure not declared in the contract (`TProcedures`
 *   is inferred from the literal you pass; the
 *   `Record<Exclude<...>, never>` intersection makes any extra key
 *   unsatisfiable).
 * - **Wrong query/mutation kind** — `.query(...)` where the contract says
 *   `mutation`, or vice versa.
 * - **Wrong input/output schema or handler return type** — anything that
 *   doesn't structurally match the derived `QueryProcedure` /
 *   `MutationProcedure`.
 */
export function createContractTRPCRouter<
  TContract extends RouterContract,
  // `TProcedures` is inferred from the actual argument so we can detect
  // extra keys via the `Record<Exclude<...>, never>` intersection below.
  // It defaults to `ContractRouterRecord<TContract, TrpcMeta>` so callers
  // only need to supply `<typeof contract>` explicitly.
  TProcedures extends ContractRouterRecord<
    TContract,
    TrpcMeta
  > = ContractRouterRecord<TContract, TrpcMeta>,
>(
  procedures: TProcedures &
    Record<Exclude<keyof TProcedures, keyof TContract>, never>,
) {
  return createTRPCRouter(
    procedures as ContractRouterRecord<TContract, TrpcMeta>,
  );
}
