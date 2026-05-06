import { describe, expect, it } from 'vitest';
import { parseDnskeyRecord } from '../parseDnskeyRecord';

describe('parseDnskeyRecord', () => {
  it('should correctly parse a standard DNSKEY record', () => {
    const record =
      'example.com. 3600 IN DNSKEY 257 3 13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const parsed = parseDnskeyRecord(record);

    expect(parsed.recordName).toBe('example.com.');
    expect(parsed.recordTtl).toBe(3600);
    expect(parsed.recordClass).toBe('IN');
    expect(parsed.recordType).toBe('DNSKEY');
    expect(parsed.flags).toBe(257);
    expect(parsed.protocol).toBe(3);
    expect(parsed.algorithm).toBe(13);
    expect(parsed.publicKey).toBe(
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
    );
  });

  it('should handle records with tab separators', () => {
    const record =
      'example.com.\t3600\tIN\tDNSKEY\t257\t3\t13\tg2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const parsed = parseDnskeyRecord(record);

    expect(parsed.recordName).toBe('example.com.');
    expect(parsed.recordTtl).toBe(3600);
    expect(parsed.recordClass).toBe('IN');
    expect(parsed.recordType).toBe('DNSKEY');
    expect(parsed.flags).toBe(257);
    expect(parsed.protocol).toBe(3);
    expect(parsed.algorithm).toBe(13);
    expect(parsed.publicKey).toBe(
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
    );
  });

  it('should handle records with mixed separators', () => {
    const record =
      'example.com. 3600 IN DNSKEY\t257 3\t13 g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==';

    const parsed = parseDnskeyRecord(record);

    expect(parsed.recordName).toBe('example.com.');
    expect(parsed.recordTtl).toBe(3600);
    expect(parsed.recordClass).toBe('IN');
    expect(parsed.recordType).toBe('DNSKEY');
    expect(parsed.flags).toBe(257);
    expect(parsed.protocol).toBe(3);
    expect(parsed.algorithm).toBe(13);
    expect(parsed.publicKey).toBe(
      'g2sb5aS1wJZPanPqAeUzcb6pNM6h9ruKJb2ptCEtppMEBdmvVnS49wATr083ghefNvYN2tl552ICYiNxm2q54w==',
    );
  });

  it('should handle records with mixed separators and public-key with separators', () => {
    const record =
      'vibecoding.city.\t300	IN	DNSKEY\t257 3 8 AwEAAbc3rwTxs7V95iDBmSwcT9j3T+SJiy5yU2VngyXG0OUIcStBgoGk 7+m3vD7kycmnHlzFWgndxzInCtZsIRSeeSWY+efjEzI3kMs9d+Fzl5xc j7FAYJysuulv0S/hUruA+8HyGru+/75i1Dkx4bqAxLNEhn3Gypnfx3CG n+i5tzKNl0gGzY7Qi6EEyob9TwFisLSvDkmfE7DAHNhk47g2EuZLLVeF ptIRiDkS2RLjIk/rvJJ7gtS/Gn/TyVvbnbszP7np4G1oHluQIsWfwIiU qj/gn3fI007rSi7eY+Q+NLxDfxkASf5FurKAjsNHIEipBe1tuDLkODM1 CCXUtqOB9Jc=';

    const parsed = parseDnskeyRecord(record);

    expect(parsed.recordName).toBe('vibecoding.city.');
    expect(parsed.recordTtl).toBe(300);
    expect(parsed.recordClass).toBe('IN');
    expect(parsed.recordType).toBe('DNSKEY');
    expect(parsed.flags).toBe(257);
    expect(parsed.protocol).toBe(3);
    expect(parsed.algorithm).toBe(8);
    expect(parsed.publicKey).toBe(
      'AwEAAbc3rwTxs7V95iDBmSwcT9j3T+SJiy5yU2VngyXG0OUIcStBgoGk7+m3vD7kycmnHlzFWgndxzInCtZsIRSeeSWY+efjEzI3kMs9d+Fzl5xcj7FAYJysuulv0S/hUruA+8HyGru+/75i1Dkx4bqAxLNEhn3Gypnfx3CGn+i5tzKNl0gGzY7Qi6EEyob9TwFisLSvDkmfE7DAHNhk47g2EuZLLVeFptIRiDkS2RLjIk/rvJJ7gtS/Gn/TyVvbnbszP7np4G1oHluQIsWfwIiUqj/gn3fI007rSi7eY+Q+NLxDfxkASf5FurKAjsNHIEipBe1tuDLkODM1CCXUtqOB9Jc=',
    );
  });
});
