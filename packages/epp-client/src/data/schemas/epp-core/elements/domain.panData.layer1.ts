/**
 * Layer-1 XML JSON schema for <domain:panData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainPanDataTypeXml } from '../types/domain.panDataType.layer1';

export const DomainPanDataXml = DomainPanDataTypeXml;

export type DomainPanDataXml = z.infer<typeof DomainPanDataXml>;
