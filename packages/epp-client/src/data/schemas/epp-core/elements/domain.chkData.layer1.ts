/**
 * Layer-1 XML JSON schema for <domain:chkData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainChkDataTypeXml } from '../types/domain.chkDataType.layer1';

export const DomainChkDataXml = DomainChkDataTypeXml;

export type DomainChkDataXml = z.infer<typeof DomainChkDataXml>;
