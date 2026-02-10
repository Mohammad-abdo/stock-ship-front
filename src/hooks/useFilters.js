import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Unified filtering hook for products/items
 * Supports: search query, category, tags, price range, sort, pagination
 * Syncs with URL query params for shareable/bookmarkable filters
 */
export function useFilters({
  items = [],
  initialFilters = {},
  debounceMs = 300,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial filters from URL or props
  const getInitialFilters = () => {
    const urlFilters = {
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort: searchParams.get('sort') || 'default',
      page: parseInt(searchParams.get('page') || '1', 10),
    };
    
    return { ...urlFilters, ...initialFilters };
  };

  const [filters, setFilters] = useState(getInitialFilters);
  const [debouncedQuery, setDebouncedQuery] = useState(filters.q);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.q);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [filters.q, debounceMs]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (filters.category) params.set('category', filters.category);
    if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.sort !== 'default') params.set('sort', filters.sort);
    if (filters.page > 1) params.set('page', filters.page.toString());

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, filters.category, filters.tags, filters.minPrice, filters.maxPrice, filters.sort, filters.page, setSearchParams]);

  // Normalize text for search (handles Arabic and English)
  const normalizeText = useCallback((text) => {
    if (!text) return '';
    return String(text)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  }, []);

  // Filter items based on all active filters
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search query filter
    if (debouncedQuery) {
      const query = normalizeText(debouncedQuery);
      result = result.filter((item) => {
        const searchableFields = [
          item.title,
          item.name,
          item.description,
          item.desc,
          item.category,
          item.seller,
          item.companyName,
        ].filter(Boolean);
        
        return searchableFields.some((field) =>
          normalizeText(field).includes(query)
        );
      });
    }

    // Category filter
    if (filters.category) {
      result = result.filter((item) => {
        const itemCategory = normalizeText(item.category || '');
        const filterCategory = normalizeText(filters.category);
        return itemCategory === filterCategory || itemCategory.includes(filterCategory);
      });
    }

    // Tags filter (AND logic - item must have all selected tags)
    if (filters.tags.length > 0) {
      result = result.filter((item) => {
        const itemTags = (item.tags || []).map(normalizeText);
        return filters.tags.every((tag) =>
          itemTags.some((itemTag) => itemTag.includes(normalizeText(tag)))
        );
      });
    }

    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      result = result.filter((item) => {
        const price = parseFloat(item.price || item.pricePerPiece || item.total || 0);
        const min = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const max = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Sort
    if (filters.sort !== 'default') {
      result = [...result].sort((a, b) => {
        switch (filters.sort) {
          case 'price-asc':
            return (parseFloat(a.price || a.pricePerPiece || 0)) - (parseFloat(b.price || b.pricePerPiece || 0));
          case 'price-desc':
            return (parseFloat(b.price || b.pricePerPiece || 0)) - (parseFloat(a.price || a.pricePerPiece || 0));
          case 'rating-desc':
            return (b.rating || 0) - (a.rating || 0);
          case 'rating-asc':
            return (a.rating || 0) - (b.rating || 0);
          case 'reviews-desc':
            return (b.reviews || 0) - (a.reviews || 0);
          case 'name-asc':
            return (a.title || a.name || '').localeCompare(b.title || b.name || '', 'ar');
          case 'name-desc':
            return (b.title || b.name || '').localeCompare(a.title || a.name || '', 'ar');
          default:
            return 0;
        }
      });
    }

    return result;
  }, [items, debouncedQuery, filters, normalizeText]);

  // Update filter
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      // Reset page when filters change (except page itself)
      if (key !== 'page') {
        newFilters.page = 1;
      }
      return newFilters;
    });
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((updates) => {
    setFilters((prev) => {
      const newFilters = { ...prev, ...updates };
      // Reset page if any filter changed (except page itself)
      if (!updates.page) {
        newFilters.page = 1;
      }
      return newFilters;
    });
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      q: '',
      category: '',
      tags: [],
      minPrice: '',
      maxPrice: '',
      sort: 'default',
      page: 1,
    });
    setDebouncedQuery('');
  }, []);

  // Clear specific filter
  const clearFilter = useCallback((key) => {
    updateFilter(key, key === 'tags' ? [] : key === 'sort' ? 'default' : '');
  }, [updateFilter]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedQuery) count++;
    if (filters.category) count++;
    if (filters.tags.length > 0) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.sort !== 'default') count++;
    return count;
  }, [debouncedQuery, filters]);

  return {
    filters,
    filteredItems,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
    activeFilterCount,
  };
}

