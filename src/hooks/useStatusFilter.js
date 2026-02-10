import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Simplified filter hook for status-based filtering (e.g., orders by status)
 * Syncs with URL query params
 */
export function useStatusFilter({
  items = [],
  statusKey = 'status',
  defaultStatus = 'all',
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || defaultStatus;
  const [activeStatus, setActiveStatus] = useState(initialStatus);

  // Update URL when status changes
  const updateStatus = useCallback((status) => {
    setActiveStatus(status);
    const params = new URLSearchParams(searchParams);
    if (status === defaultStatus) {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    setSearchParams(params, { replace: true });
  }, [defaultStatus, searchParams, setSearchParams]);

  // Filter items by status
  const filteredItems = useMemo(() => {
    if (activeStatus === 'all') return items;
    return items.filter((item) => item[statusKey] === activeStatus);
  }, [items, activeStatus, statusKey]);

  return {
    activeStatus,
    setActiveStatus: updateStatus,
    filteredItems,
  };
}

