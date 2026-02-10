/**
 * Get API base URL for images
 */
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path starting with /uploads, prepend API URL
  if (imagePath.startsWith('/uploads')) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace('/api', ''); // Remove /api to get base URL
    return `${BASE_URL}${imagePath}`;
  }
  
  // If it's a relative path without /uploads, assume it's in uploads
  if (!imagePath.startsWith('/')) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const BASE_URL = API_URL.replace('/api', '');
    return `${BASE_URL}/uploads/${imagePath}`;
  }
  
  return imagePath;
};

/**
 * Transform Backend Offer to Frontend Product format
 * This ensures we don't change the design, just map the data
 */
export const transformOfferToProduct = (offer) => {
  // Parse images
  let images = [];
  if (offer.images) {
    try {
      const parsedImages = typeof offer.images === 'string' ? JSON.parse(offer.images) : offer.images;
      // Convert image paths to full URLs
      images = Array.isArray(parsedImages) 
        ? parsedImages.map(img => getImageUrl(img)).filter(img => img !== null)
        : [];
    } catch (e) {
      images = [];
    }
  }

  // Get first image or default
  const mainImage = images && images.length > 0 
    ? images[0] 
    : "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200&q=80&auto=format&fit=crop";

  // Get category name
  const categoryName = offer.categoryRelation?.nameKey || offer.category || "عام";

  return {
    id: offer.id,
    title: offer.title || "عرض بدون عنوان",
    category: categoryName,
    image: mainImage,
    images: images,
    subtitle: offer.description || "لوريم إيبسوم دولور سيت أم",
    rating: 5, // Default rating (can be calculated from deals later)
    reviews: offer._count?.deals || 0,
    badgeText: offer.status === 'ACTIVE' ? "FOR SALE" : null,
    // Additional offer data
    offer: {
      id: offer.id,
      trader: offer.trader,
      totalCartons: offer.totalCartons,
      totalCBM: offer.totalCBM,
      acceptsNegotiation: offer.acceptsNegotiation,
      country: offer.country,
      city: offer.city,
      items: offer.items || [],
      dealsCount: offer._count?.deals || 0,
      itemsCount: offer._count?.items || 0
    }
  };
};

/**
 * Transform multiple offers to products
 */
export const transformOffersToProducts = (offers) => {
  return offers.map(transformOfferToProduct);
};







