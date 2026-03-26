import { snapshotPath } from './constants';
import { readJsonFile } from './json';
import type {
  CachedOpenApiDocument,
  Eip712Field,
  IndexedOperation,
  ManifestEntry,
  MediaTypeSummary,
  ParameterSummary,
  RequestBodySummary,
  ResponseSummary,
  SchemaSummary,
} from './types';
import {
  asString,
  asStringArray,
  deriveAuthMode,
  isRecord,
  payloadTypeFromPrimaryType,
  uniqueStrings,
} from './utils';

const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
]);

function normalizeEip712Types(
  value: unknown,
): Record<string, Eip712Field[]> | null {
  if (!isRecord(value)) {
    return null;
  }

  const normalized: Record<string, Eip712Field[]> = {};

  for (const [typeName, rawFields] of Object.entries(value)) {
    if (!Array.isArray(rawFields)) {
      continue;
    }

    const fields = rawFields
      .map((rawField) => {
        if (!isRecord(rawField)) {
          return null;
        }

        const name = asString(rawField.name);
        const type = asString(rawField.type);

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

function summarizeSchema(value: unknown): SchemaSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const properties = isRecord(value.properties)
    ? Object.keys(value.properties)
    : [];
  const items = isRecord(value.items) ? value.items : null;
  const variants = [
    ...(Array.isArray(value.oneOf) ? value.oneOf : []),
    ...(Array.isArray(value.anyOf) ? value.anyOf : []),
    ...(Array.isArray(value.allOf) ? value.allOf : []),
  ]
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      return asString(entry.$ref) ?? asString(entry.type);
    })
    .filter((entry): entry is string => entry !== null);

  const summary: SchemaSummary = {
    type: asString(value.type),
    ref: asString(value.$ref),
    format: asString(value.format),
    enumValues: Array.isArray(value.enum)
      ? value.enum.filter((entry): entry is string => typeof entry === 'string')
      : [],
    properties,
    requiredProperties: asStringArray(value.required),
    itemsType: items ? asString(items.type) : null,
    itemsRef: items ? asString(items.$ref) : null,
    variants,
  };

  const hasData =
    summary.type ||
    summary.ref ||
    summary.format ||
    summary.enumValues.length > 0 ||
    summary.properties.length > 0 ||
    summary.requiredProperties.length > 0 ||
    summary.itemsType ||
    summary.itemsRef ||
    summary.variants.length > 0;

  return hasData ? summary : null;
}

function summarizeMediaTypes(value: unknown): MediaTypeSummary[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value)
    .map(([contentType, mediaTypeValue]) => {
      const mediaType = isRecord(mediaTypeValue) ? mediaTypeValue : null;
      return {
        contentType,
        schema: summarizeSchema(mediaType?.schema),
      };
    })
    .sort((left, right) => left.contentType.localeCompare(right.contentType));
}

function summarizeParameters(value: unknown): ParameterSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((parameterValue) => {
      if (!isRecord(parameterValue)) {
        return null;
      }

      const name = asString(parameterValue.name);
      const location = asString(parameterValue.in);

      if (!name || !location) {
        return null;
      }

      return {
        name,
        in: location,
        required: parameterValue.required === true,
        description: asString(parameterValue.description),
        schema: summarizeSchema(parameterValue.schema),
      } satisfies ParameterSummary;
    })
    .filter((parameter): parameter is ParameterSummary => parameter !== null)
    .sort(
      (left, right) =>
        left.in.localeCompare(right.in) || left.name.localeCompare(right.name),
    );
}

function summarizeRequestBody(value: unknown): RequestBodySummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const requestBody: RequestBodySummary = {
    required: value.required === true,
    description: asString(value.description),
    content: summarizeMediaTypes(value.content),
  };

  return requestBody.content.length > 0 ||
    requestBody.description ||
    requestBody.required
    ? requestBody
    : null;
}

function summarizeResponses(value: unknown): ResponseSummary[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value)
    .map(([status, responseValue]) => {
      if (!isRecord(responseValue)) {
        return null;
      }

      return {
        status,
        description: asString(responseValue.description),
        content: summarizeMediaTypes(responseValue.content),
      } satisfies ResponseSummary;
    })
    .filter((response): response is ResponseSummary => response !== null)
    .sort((left, right) => left.status.localeCompare(right.status));
}

function extractBadgeNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueStrings(
    value
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry;
        }

        if (!isRecord(entry)) {
          return null;
        }

        return asString(entry.name);
      })
      .filter((entry): entry is string => entry !== null),
  );
}

export async function loadCachedOpenApiDocument(
  env: string,
): Promise<CachedOpenApiDocument> {
  return readJsonFile<CachedOpenApiDocument>(snapshotPath(env));
}

export function countOpenApiOperations(
  document: Record<string, unknown>,
): number {
  const paths = isRecord(document.paths) ? document.paths : {};
  let count = 0;

  for (const pathItemValue of Object.values(paths)) {
    if (!isRecord(pathItemValue)) {
      continue;
    }

    for (const [key] of Object.entries(pathItemValue)) {
      if (HTTP_METHODS.has(key.toLowerCase())) {
        count += 1;
      }
    }
  }

  return count;
}

function sortOperations(operations: IndexedOperation[]): IndexedOperation[] {
  return operations.sort(
    (left, right) =>
      left.operationId.localeCompare(right.operationId) ||
      left.method.localeCompare(right.method) ||
      left.path.localeCompare(right.path),
  );
}

function normalizeOpenApiOperation(args: {
  env: string;
  config: ManifestEntry;
  path: string;
  methodKey: string;
  operationValue: Record<string, unknown>;
  pathLevelParameters: unknown[];
}): IndexedOperation | null {
  const operationId = asString(args.operationValue.operationId);
  if (!operationId) {
    return null;
  }

  const parameters = summarizeParameters([
    ...args.pathLevelParameters,
    ...(Array.isArray(args.operationValue.parameters)
      ? args.operationValue.parameters
      : []),
  ]);
  const requestBody = summarizeRequestBody(args.operationValue.requestBody);
  const responses = summarizeResponses(args.operationValue.responses);
  const tags = uniqueStrings(asStringArray(args.operationValue.tags));
  const badgeNames = extractBadgeNames(args.operationValue['x-badges']);
  const acceptedPrimaryTypes = uniqueStrings(
    asStringArray(args.operationValue['x-eip712-accepted-primary-types']),
  );
  const primaryType = acceptedPrimaryTypes[0] ?? null;
  const eip712Types = normalizeEip712Types(
    args.operationValue['x-eip712-types'],
  );
  const hasEip712 = acceptedPrimaryTypes.length > 0 || eip712Types !== null;
  const authKind = 'unknown';

  return {
    env: args.env,
    requestBaseUrl: args.config.requestBaseUrl,
    openapiUrl: args.config.openapiUrl,
    method: args.methodKey.toUpperCase(),
    path: args.path,
    operationId,
    summary: asString(args.operationValue.summary),
    description: asString(args.operationValue.description),
    tags,
    badgeNames,
    parameters,
    requestBody,
    responses,
    hasEip712,
    acceptedPrimaryTypes,
    primaryType,
    payloadType: payloadTypeFromPrimaryType(primaryType),
    eip712Types,
    authKind,
    authMode: deriveAuthMode({ authKind, hasEip712 }),
    authSource: null,
    publishedInEnvOpenapi: true,
    routeSource: 'openapi',
    metadataSource: {
      summary: 'openapi',
      description: 'openapi',
      parameters: 'openapi',
      requestBody: requestBody ? 'openapi' : null,
      responses: responses.length > 0 ? 'openapi' : null,
      eip712: hasEip712 ? 'openapi' : null,
    },
    fallbacksApplied: [],
    warnings: [],
  };
}

function normalizePathItemOperations(args: {
  env: string;
  config: ManifestEntry;
  path: string;
  pathItemValue: Record<string, unknown>;
}): IndexedOperation[] {
  const pathLevelParameters = Array.isArray(args.pathItemValue.parameters)
    ? args.pathItemValue.parameters
    : [];

  return Object.entries(args.pathItemValue)
    .map(([methodKey, operationValue]) => {
      if (
        !HTTP_METHODS.has(methodKey.toLowerCase()) ||
        !isRecord(operationValue)
      ) {
        return null;
      }

      return normalizeOpenApiOperation({
        env: args.env,
        config: args.config,
        path: args.path,
        methodKey,
        operationValue,
        pathLevelParameters,
      });
    })
    .filter((operation): operation is IndexedOperation => operation !== null);
}

export function normalizeOpenApiOperations(args: {
  env: string;
  config: ManifestEntry;
  cached: CachedOpenApiDocument;
}): IndexedOperation[] {
  const document = isRecord(args.cached.document) ? args.cached.document : {};
  const paths = isRecord(document.paths) ? document.paths : {};

  return sortOperations(
    Object.entries(paths).flatMap(([path, pathItemValue]) => {
      if (!isRecord(pathItemValue)) {
        return [];
      }

      return normalizePathItemOperations({
        env: args.env,
        config: args.config,
        path,
        pathItemValue,
      });
    }),
  );
}
