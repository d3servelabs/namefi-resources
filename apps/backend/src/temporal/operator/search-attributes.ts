/** biome-ignore-all lint/style/useNamingConvention: depends on external libs with different naming conventions */
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import { createTemporalEphemeralConnection } from '#temporal/client';

const logger = createLogger({
  module: 'temporal/operator/search-attributes',
  context: 'Temporal',
});
/**
 * Copied from @temporalio/proto/protos/index.d.ts, issues with imports
 * ```ts
 * import { temporal } from '@temporalio/proto';
 * const IndexedValueType = temporal.api.enums.v1.IndexedValueType;
 * type IndexedValueType = temporal.api.enums.v1.IndexedValueType;
 * ```
 */
enum IndexedValueType {
  INDEXED_VALUE_TYPE_UNSPECIFIED = 0,
  INDEXED_VALUE_TYPE_TEXT = 1,
  INDEXED_VALUE_TYPE_KEYWORD = 2,
  INDEXED_VALUE_TYPE_INT = 3,
  INDEXED_VALUE_TYPE_DOUBLE = 4,
  INDEXED_VALUE_TYPE_BOOL = 5,
  INDEXED_VALUE_TYPE_DATETIME = 6,
  INDEXED_VALUE_TYPE_KEYWORD_LIST = 7,
}

// Map string types to IndexedValueType enum values
const typeMap: Record<string, IndexedValueType> = {
  Keyword: IndexedValueType.INDEXED_VALUE_TYPE_KEYWORD,
  Text: IndexedValueType.INDEXED_VALUE_TYPE_TEXT,
  Int: IndexedValueType.INDEXED_VALUE_TYPE_INT,
  Double: IndexedValueType.INDEXED_VALUE_TYPE_DOUBLE,
  Bool: IndexedValueType.INDEXED_VALUE_TYPE_BOOL,
  Datetime: IndexedValueType.INDEXED_VALUE_TYPE_DATETIME,
  KeywordList: IndexedValueType.INDEXED_VALUE_TYPE_KEYWORD_LIST,
};

const namespace = config.TEMPORAL_NAMESPACE;
type SearchAttribute = {
  name: string;
  description: string;
  type: keyof typeof typeMap;
};

/**
 * Search attributes that should be available in the Temporal namespace
 * These match the attributes defined in temporal-search-attributes.sh
 */
const CUSTOM_SEARCH_ATTRIBUTES = [
  {
    name: 'orderId',
    description: 'Unique identifier for an order workflow execution',
    type: 'Keyword',
  },
  {
    name: 'affectedResources',
    description: 'Identifies the resource that was affected by the workflow',
    type: 'KeywordList',
  },
  {
    name: 'callerType',
    description: 'Identifies the type of caller of the workflow',
    type: 'Keyword',
  },
  {
    name: 'caller',
    description: 'Identifies the caller of the workflow',
    type: 'Keyword',
  },
  {
    name: 'userId',
    description:
      'The user ID of the user who initiated/associated with the workflow',
    type: 'Keyword',
  },
  {
    name: 'domainName',
    description: 'The domain name (normalized) associated with the workflow',
    type: 'Text',
  },
];

const CUSTOM_SEARCH_ATTRIBUTES_MAP = new Map<string, SearchAttribute>(
  CUSTOM_SEARCH_ATTRIBUTES.map((attr) => [attr.name, attr]),
);
/**
 * Checks for missing search attributes by comparing desired attributes
 * with existing ones in the Temporal namespace
 * @returns Promise<string[]> Array of missing attribute names
 */
export async function checkMissingAttributes(): Promise<string[]> {
  const temporalConnection = await createTemporalEphemeralConnection();

  try {
    const response =
      await temporalConnection.operatorService.listSearchAttributes({
        namespace,
      });

    const existingAttributes = response.customAttributes || {};
    const existingKeys = Object.keys(existingAttributes);

    const missingAttributes = CUSTOM_SEARCH_ATTRIBUTES.map(
      (attr) => attr.name,
    ).filter((name) => !existingKeys.includes(name));

    return missingAttributes;
  } catch (error) {
    try {
      logger.error(
        Buffer.from(
          JSON.parse(JSON.stringify(error)).metadata[
            'grpc-status-details-bin'
          ][0] as Buffer,
        ).toString(),
      );
    } catch {}
    logger.error(error, 'Error listing search attributes');
    throw error;
  } finally {
    await temporalConnection.close();
  }
}

/**
 * Creates missing search attributes in the Temporal namespace
 * @param missingAttributes Array of attribute names to create
 * @returns Promise<void>
 */
export async function createMissingAttributes(
  missingAttributes: string[],
): Promise<void> {
  if (missingAttributes.length === 0) {
    logger.debug('✓ No missing search attributes to create');
    return;
  }
  const temporalConnection = await createTemporalEphemeralConnection();

  try {
    // Create the attributes map for the missing ones
    const attributesToCreate: Record<string, number> = {};

    for (const attr of missingAttributes) {
      const attrConfig = CUSTOM_SEARCH_ATTRIBUTES_MAP.get(attr);
      if (attrConfig) {
        attributesToCreate[attr] = typeMap[attrConfig.type];
        logger.debug(
          `Creating search attribute '${attr}' (${attrConfig.type})...`,
        );
      }
    }

    await temporalConnection.operatorService.addSearchAttributes({
      namespace,
      searchAttributes: attributesToCreate,
    });

    logger.debug(
      `✓ Successfully created ${missingAttributes.length} search attributes: ${missingAttributes.join(', ')}`,
    );
  } catch (error) {
    logger.error(error, 'Error creating search attributes');
    throw error;
  } finally {
    await temporalConnection.close();
  }
}

/**
 * Validates that all required search attributes exist, creating missing ones if needed
 * @returns Promise<boolean> True if all attributes are present after validation
 */
export async function validateAndCreateSearchAttributes(): Promise<boolean> {
  try {
    logger.debug('Validating search attributes...');

    const missingAttributes = await checkMissingAttributes();

    if (missingAttributes.length > 0) {
      logger.debug(
        `Found ${missingAttributes.length} missing search attributes: ${missingAttributes.join(', ')}`,
      );
      await createMissingAttributes(missingAttributes);
    } else {
      logger.debug('✓ All required search attributes are present');
    }

    // Double-check that everything was created successfully
    const stillMissing = await checkMissingAttributes();
    const isValid = stillMissing.length === 0;

    if (!isValid) {
      logger.error(
        `❌ Validation failed. Still missing: ${stillMissing.join(', ')}`,
      );
    } else {
      logger.debug('✓ Search attributes validation completed successfully');
    }

    return isValid;
  } catch (error) {
    logger.error(error, 'Error during search attributes validation');
    return false;
  }
}
