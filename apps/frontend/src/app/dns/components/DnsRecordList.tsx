'use client';

import { useTRPC } from '@/utils/trpc';
import type { DnsRecordSelect } from '@namefi-astra/backend/lib/db/types';
import { useMutation } from '@tanstack/react-query';

interface DnsRecordListProps {
  records: DnsRecordSelect[] | undefined;
  normalizedDomainName: string;
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onEditRecord?: (record: DnsRecordSelect) => void;
}

export default function DnsRecordList({
  records,
  normalizedDomainName,
  isLoading,
  error,
  onRefresh,
  onEditRecord,
}: DnsRecordListProps) {
  const trpc = useTRPC();

  // Delete DNS record mutation
  const deleteDnsRecord = useMutation(
    trpc.dnsRecords.deleteRecord.mutationOptions({
      onSuccess: onRefresh,
    }),
  );

  if (isLoading) {
    return <p className="text-gray-500">Loading DNS records...</p>;
  }

  if (error) {
    return (
      <p className="text-red-500">Error loading DNS records: {error.message}</p>
    );
  }

  if (!records || records.length === 0) {
    return <p className="text-gray-500">No DNS records found</p>;
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div
          key={record.id}
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex justify-between items-center"
        >
          <div>
            <p className="font-semibold text-sm text-gray-800">
              {record.name}.{normalizedDomainName}
              <span className="text-gray-500">({record.type})</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">{record.rdata}</p>
            <p className="text-xs text-gray-400 mt-1">TTL: {record.ttl}</p>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
              onClick={() => {
                if (onEditRecord) {
                  onEditRecord(record);
                }
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
              onClick={() =>
                deleteDnsRecord.mutateAsync({
                  id: record.id as string,
                  normalizedDomainName,
                })
              }
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
