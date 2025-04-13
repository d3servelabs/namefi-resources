'use client';

import { useTRPC } from '@/utils/trpc';
import type { DnsRecordSelect } from '@namefi-astra/db/types';
import type { RecordType } from '@namefi-astra/zod-dns';
import { useMutation, useQuery } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useState } from 'react';
import DnsRecordForm from './components/DnsRecordForm';
import DnsRecordList from './components/DnsRecordList';
export default function DnsPage() {
  // DNS records state
  const [domainName, setDomainName] = useState<string>('test.com');
  const trpc = useTRPC();

  // Modal state for editing records
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecordSelect | null>(
    null,
  );

  // Query DNS records
  const dnsRecords = useQuery(
    trpc.dnsRecords.getRecords.queryOptions({
      zoneName: domainName,
    }),
  );

  // Handler for edit button click
  const handleEditRecord = (record: DnsRecordSelect) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
    setIsAnimatingOut(false);
  };

  // Handler for closing the modal with animation
  const handleCloseModal = () => {
    setIsAnimatingOut(true);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setIsEditModalOpen(false);
      setEditingRecord(null);
      setIsAnimatingOut(false);
    }, 300); // Match this duration with the CSS transition duration
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Clear any lingering timeouts
      if (isAnimatingOut) {
        setIsEditModalOpen(false);
        setEditingRecord(null);
        setIsAnimatingOut(false);
      }
    };
  }, [isAnimatingOut]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">DNS Records Management</h1>

      {/* Domain name input */}
      <div className="mb-6">
        <label
          htmlFor="domainName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Domain Name
        </label>
        <div className="flex gap-2">
          <input
            id="domainName"
            type="text"
            className="flex-1 border border-gray-300 rounded-md p-2"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
          />
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            onClick={() => dnsRecords.refetch()}
          >
            Load Records
          </button>
        </div>
      </div>

      {/* DNS Record Form */}
      <div className="mb-6">
        <DnsRecordForm
          domainName={domainName}
          onSuccess={() => dnsRecords.refetch()}
        />
      </div>

      {/* DNS Records List */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">DNS Records</h2>
        <DnsRecordList
          records={dnsRecords.data as DnsRecordSelect[] | undefined}
          normalizedDomainName={domainName}
          isLoading={dnsRecords.isLoading}
          error={dnsRecords.error as Error | null}
          onRefresh={() => dnsRecords.refetch()}
          onEditRecord={handleEditRecord}
        />
      </div>

      {/* Edit Modal with Animation */}
      {isEditModalOpen && editingRecord && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
            isAnimatingOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Modal Backdrop with click handler to close */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
              isAnimatingOut ? 'opacity-0' : 'bg-opacity-50'
            }`}
            onClick={handleCloseModal}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCloseModal();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          />

          {/* Modal Content */}
          <div
            className={`bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative z-10 transition-all duration-300 ease-in-out ${
              isAnimatingOut
                ? 'opacity-0 scale-95 translate-y-4'
                : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit DNS Record</h2>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <EditDnsRecordForm
              record={editingRecord}
              domainName={domainName}
              onClose={handleCloseModal}
              onSuccess={() => {
                dnsRecords.refetch();
                handleCloseModal();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Edit DNS Record Form Component
function EditDnsRecordForm({
  record,
  domainName,
  onClose,
  onSuccess,
}: {
  record: DnsRecordSelect;
  domainName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const [recordType, setRecordType] = useState<RecordType>(record.type || 'A');
  const [recordName, setRecordName] = useState<string>(record.name || '@');
  const [recordValue, setRecordValue] = useState<string>(record.rdata || '');
  const [ttl, setTtl] = useState<number>(record.ttl || 120);
  const [error, setError] = useState<string | null>(null);

  // Update DNS record mutation
  const updateDnsRecord = useMutation(
    trpc.dnsRecords.updateRecord.mutationOptions({
      onSuccess: () => {
        onSuccess();
      },
      onError: (err) => {
        setError(err.message || 'Failed to update DNS record');
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Call the update mutation with the form data
    updateDnsRecord.mutateAsync({
      id: record.id as string,
      zoneName: domainName,
      type: recordType,
      name: recordName,
      rdata: recordValue,
      ttl: ttl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="editRecordType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Record Type
          </label>
          <select
            id="editRecordType"
            className="w-full border border-gray-300 rounded-md p-2"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as RecordType)}
            disabled={updateDnsRecord.isPending}
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
            htmlFor="editRecordName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            id="editRecordName"
            type="text"
            className="w-full border border-gray-300 rounded-md p-2"
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
            placeholder="@ for root domain"
            disabled={updateDnsRecord.isPending}
          />
        </div>

        <div>
          <label
            htmlFor="editRecordValue"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Value
          </label>
          <input
            id="editRecordValue"
            type="text"
            className="w-full border border-gray-300 rounded-md p-2"
            value={recordValue}
            onChange={(e) => setRecordValue(e.target.value)}
            placeholder={recordType === 'A' ? '192.168.1.1' : 'Value'}
            disabled={updateDnsRecord.isPending}
          />
        </div>

        <div>
          <label
            htmlFor="editTtl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            TTL (seconds)
          </label>
          <input
            id="editTtl"
            type="number"
            className="w-full border border-gray-300 rounded-md p-2"
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
            min="1"
            disabled={updateDnsRecord.isPending}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onClose}
          disabled={updateDnsRecord.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          disabled={updateDnsRecord.isPending}
        >
          {updateDnsRecord.isPending ? 'Updating...' : 'Update Record'}
        </button>
      </div>
    </form>
  );
}
