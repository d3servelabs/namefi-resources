/**
 * Layer-1 XML JSON schema for type epp:resDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainChkDataXml } from '../elements/domain.chkData.layer1';
import { DomainCreDataXml } from '../elements/domain.creData.layer1';
import { DomainInfDataXml } from '../elements/domain.infData.layer1';
import { DomainPanDataXml } from '../elements/domain.panData.layer1';
import { DomainRenDataXml } from '../elements/domain.renData.layer1';
import { DomainTrnDataXml } from '../elements/domain.trnData.layer1';
import { ContactChkDataXml } from '../elements/contact.chkData.layer1';
import { ContactCreDataXml } from '../elements/contact.creData.layer1';
import { ContactInfDataXml } from '../elements/contact.infData.layer1';
import { ContactPanDataXml } from '../elements/contact.panData.layer1';
import { ContactTrnDataXml } from '../elements/contact.trnData.layer1';
import { HostChkDataXml } from '../elements/host.chkData.layer1';
import { HostCreDataXml } from '../elements/host.creData.layer1';
import { HostInfDataXml } from '../elements/host.infData.layer1';
import { HostPanDataXml } from '../elements/host.panData.layer1';

export const EppResDataTypeXml = z.union([
  zloosen(
    z.object({
      'domain:chkData': DomainChkDataXml,
    }),
  ),
  zloosen(
    z.object({
      'domain:creData': DomainCreDataXml,
    }),
  ),
  zloosen(
    z.object({
      'domain:infData': DomainInfDataXml,
    }),
  ),
  zloosen(
    z.object({
      'domain:panData': DomainPanDataXml,
    }),
  ),
  zloosen(
    z.object({
      'domain:renData': DomainRenDataXml,
    }),
  ),
  zloosen(
    z.object({
      'domain:trnData': DomainTrnDataXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:chkData': ContactChkDataXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:creData': ContactCreDataXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:infData': ContactInfDataXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:panData': ContactPanDataXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:trnData': ContactTrnDataXml,
    }),
  ),
  zloosen(
    z.object({
      'host:chkData': HostChkDataXml,
    }),
  ),
  zloosen(
    z.object({
      'host:creData': HostCreDataXml,
    }),
  ),
  zloosen(
    z.object({
      'host:infData': HostInfDataXml,
    }),
  ),
  zloosen(
    z.object({
      'host:panData': HostPanDataXml,
    }),
  ),
]);

export type EppResDataTypeXml = z.infer<typeof EppResDataTypeXml>;
