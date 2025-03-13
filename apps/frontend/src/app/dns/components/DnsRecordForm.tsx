'use client';
import type React from 'react';
import { useState } from 'react';

interface DnsRecordFormProps {
  domainName: string;
  onSuccess: () => void;
}

export default function DnsRecordForm({
  domainName,
  onSuccess,
}: DnsRecordFormProps) {
  const trpc = useTRPC();
  const [recordType, setRecordType] = useState<string>('A');
  const [recordName, setRecordName] = useState<string>('@');
  const [recordValue, setRecordValue] = useState<string>('');

  // Create DNS record mutation
  const createDnsRecord = useMutation(
    trpc.dnsRecords.createDnsRecord.mutationOptions({
      onSuccess,
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createDnsRecord.mutateAsync({
      normalizedDomainName: domainName,
      type: recordType,
      name: recordName,
      rdata: recordValue,
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Add New DNS Record</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="recordType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Record Type
            </label>
            <select
              id="recordType"
              className="w-full border border-gray-300 rounded-md p-2"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
            >
              <option value="A">A (IPv4 Address)</option>
              <option value="AAAA">AAAA (IPv6 Address)</option>
              <option value="CNAME">CNAME (Canonical Name)</option>
              <option value="MX">MX (Mail Exchange)</option>
              <option value="TXT">TXT (Text)</option>
              <option value="NS">NS (Name Server)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="recordName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="recordName"
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
              placeholder="@ for root domain"
            />
          </div>

          <div>
            <label
              htmlFor="recordValue"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Value
            </label>
            <input
              id="recordValue"
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={recordValue}
              onChange={(e) => setRecordValue(e.target.value)}
              placeholder={recordType === 'A' ? '192.168.1.1' : 'Value'}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={createDnsRecord.isPending || !recordValue.trim()}
          >
            {createDnsRecord.isPending ? 'Adding...' : 'Add Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
