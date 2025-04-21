'use client';

import { Badge } from '@/components/ui/shadcn/badge';

type StatusBadgeType = 'order' | 'payment';

interface StatusBadgeProps {
  status: string;
  type: StatusBadgeType;
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const getStatusBadge = (status: string, type: StatusBadgeType) => {
    switch (status) {
      case 'CREATED':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Created
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            Processing
          </Badge>
        );
      case 'SUCCEEDED':
      case 'COMPLETED':
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-700">
            {status === 'SUCCEEDED' ? 'Succeeded' : 'Completed'}
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Failed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge
            variant="outline"
            className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          >
            Cancelled
          </Badge>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
          >
            Partially Completed
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
          >
            Pending
          </Badge>
        );
      case 'REFUND_REQUESTED':
        return (
          <Badge
            variant="outline"
            className="border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100"
          >
            Refund Requested
          </Badge>
        );
      case 'REQUIRES_CAPTURE':
        return (
          <Badge
            variant="outline"
            className="border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100"
          >
            Requires Capture
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100"
          >
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  return getStatusBadge(status, type);
}
