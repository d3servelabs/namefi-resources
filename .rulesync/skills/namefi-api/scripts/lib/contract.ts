import { contractPath } from './constants';
import { readJsonFile } from './json';
import type { ContractOperation, Eip712Field } from './types';
import {
  asString,
  asStringArray,
  isRecord,
  payloadTypeFromPrimaryType,
  uniqueStrings,
} from './utils';

function normalizeEip712Types(
  value: unknown,
): Record<string, Eip712Field[]> | null {
  if (!isRecord(value)) {
    return null;
  }

  const normalized: Record<string, Eip712Field[]> = {};

  for (const [typeName, fieldsValue] of Object.entries(value)) {
    if (!Array.isArray(fieldsValue)) {
      continue;
    }

    const fields = fieldsValue
      .map((fieldValue) => {
        if (!isRecord(fieldValue)) {
          return null;
        }

        const name = asString(fieldValue.name);
        const type = asString(fieldValue.type);

        if (!name || !type) {
          return null;
        }

        return { name, type };
      })
      .filter((field): field is Eip712Field => field !== null);

    if (fields.length > 0) {
      normalized[typeName] = fields;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

function readContractOperation(
  routeValue: unknown,
  metaValue: unknown,
  contractPathParts: string[],
): ContractOperation | null {
  if (!isRecord(routeValue)) {
    return null;
  }

  const method = asString(routeValue.method);
  const path = asString(routeValue.path);
  const operationId = asString(routeValue.operationId);

  if (!method || !path || !operationId) {
    return null;
  }

  const meta = isRecord(metaValue) ? metaValue : null;
  const eip712 = meta && isRecord(meta.eip712) ? meta.eip712 : null;
  const eip712Input = eip712 && isRecord(eip712.input) ? eip712.input : null;
  const acceptedPrimaryTypes = uniqueStrings(
    asStringArray(eip712Input?.acceptedPrimaryTypes),
  );
  const primaryType = acceptedPrimaryTypes[0] ?? null;

  return {
    operationId,
    method: method.toUpperCase(),
    path,
    summary: asString(routeValue.summary),
    description: asString(routeValue.description),
    tags: uniqueStrings(asStringArray(routeValue.tags)),
    acceptedPrimaryTypes,
    primaryType,
    payloadType: payloadTypeFromPrimaryType(primaryType),
    eip712Types: normalizeEip712Types(eip712Input?.types),
    contractPath: contractPathParts,
  };
}

function getRouteValue(
  orpcValue: Record<string, unknown>,
  metaValue: unknown,
): unknown {
  const meta = isRecord(metaValue) ? metaValue : null;

  if (meta && isRecord(meta.route)) {
    return meta.route;
  }

  if (isRecord(orpcValue.route)) {
    return orpcValue.route;
  }

  return null;
}

function extractContractOperation(
  node: Record<string, unknown>,
  contractPathParts: string[],
): ContractOperation | null {
  const orpc = isRecord(node['~orpc']) ? node['~orpc'] : null;
  if (!orpc) {
    return null;
  }

  return readContractOperation(
    getRouteValue(orpc, orpc.meta),
    isRecord(orpc.meta) ? orpc.meta : null,
    contractPathParts,
  );
}

function extractContractOperations(
  node: unknown,
  contractPathParts: string[],
  operations: ContractOperation[],
): void {
  if (!isRecord(node)) {
    return;
  }

  const operation = extractContractOperation(node, contractPathParts);
  if (operation) {
    operations.push(operation);
  }

  for (const [key, child] of Object.entries(node)) {
    if (key === '~orpc') {
      continue;
    }

    extractContractOperations(child, [...contractPathParts, key], operations);
  }
}

export async function loadContractOperations(): Promise<ContractOperation[]> {
  const contract = await readJsonFile<Record<string, unknown>>(contractPath);
  const operations: ContractOperation[] = [];
  extractContractOperations(contract, [], operations);

  return operations.sort(
    (left, right) =>
      left.operationId.localeCompare(right.operationId) ||
      left.method.localeCompare(right.method) ||
      left.path.localeCompare(right.path),
  );
}
