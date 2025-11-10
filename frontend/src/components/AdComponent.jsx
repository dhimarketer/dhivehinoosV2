import React, { useState, useEffect } from 'react';
import { Box, Spinner, Text } from './ui';
import { adsAPI } from '../services/api';
import { trackAdClick } from '../utils/analytics';
import { getOptimizedImageUrlBySize } from '../utils/imageOptimization';

const AdComponent = ({ placement, maxAds = 1 }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define which placements should be centered horizontally
  const horizontalPlacements = [
    'top_banner',
    'bottom_banner', 
    'article_header',
    'article_footer',
    'between_articles'
  ];

  const isHorizontalPlacement = horizontalPlacements.includes(placement);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        // Remove timestamp to enable caching - cache will handle TTL
        const params = placement ? { placement } : {};
        const response = await adsAPI.getActive(params);
        const adsData = response.data.results || response.data;
        
        // Limit to maxAds
        const limitedAds = Array.isArray(adsData) ? adsData.slice(0, maxAds) : [];
        setAds(limitedAds);
      } catch (err) {
        console.error('Error fetching ads:', err);
        
        // Handle different types of errors
        if (err.code === 'ECONNABORTED') {
          console.warn('Ads request timed out, skipping ad display');
          setError(null); // Don't show error for timeouts, just skip ads
        } else if (err.response?.status >= 500) {
          setError('Server error loading ads');
        } else if (err.response?.status === 404) {
          setError(null); // No ads available, don't show error
        } else {
          setError('Failed to load ads');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [placement, maxAds]);

  const handleAdClick = (ad) => {
    trackAdClick(ad.id, ad.placement?.name || 'unknown');
  };

  if (loading) {
    return (
      <Box className="text-center p-4">
        <Spinner size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="text-center p-4">
        <Text size="sm" className="text-gray-500">{error}</Text>
      </Box>
    );
  }

  if (!ads || ads.length === 0) {
    return null; // Don't render anything if no ads
  }

  return (
    <Box
      className={`${isHorizontalPlacement ? "text-center" : "text-left"} ${isHorizontalPlacement ? "w-full" : "max-w-full"} ${isHorizontalPlacement && placement === 'top_banner' ? "w-full" : "px-2 md:px-4"}`}
    >
      {ads.map((ad) => (
        <Box 
          key={ad.id} 
          className={`${placement === 'top_banner' ? "mb-0" : "mb-4"} ad-container`}
        >
          {ad.destination_url ? (
            <a
              href={ad.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleAdClick(ad)}
              className="block w-full"
            >
              {ad.image_url ? (
                <Box className="w-full" style={{ aspectRatio: '16/9', maxHeight: '500px' }}>
                  <img
                    src={getOptimizedImageUrlBySize(ad.image_url, 1280, 720)}
                    alt={ad.title}
                    className="w-full h-full hover:opacity-90 object-cover"
                    loading="lazy"
                    decoding="async"
                    width="1280"
                    height="720"
                  />
                </Box>
              ) : (
                <Box className="p-3 md:p-4 bg-gray-100 rounded-lg text-center border-2 border-dashed border-gray-300 text-sm md:text-base">
                  <Text className="font-bold text-base md:text-lg text-gray-700">
                    {ad.title}
                  </Text>
                  <Text size="sm" className="text-gray-500 mt-1">
                    Click to visit
                  </Text>
                </Box>
              )}
            </a>
          ) : (
            <Box>
              {ad.image_url ? (
                <img
                  src={getOptimizedImageUrlBySize(ad.image_url, 300, 250)}
                  alt={ad.title}
                  className="max-w-full h-auto rounded-lg mx-auto block"
                  loading="lazy"
                  decoding="async"
                  width="300"
                  height="250"
                />
              ) : (
                <Box className="p-3 md:p-4 bg-gray-100 rounded-lg text-center border-2 border-dashed border-gray-300 text-sm md:text-base">
                  <Text className="font-bold text-base md:text-lg text-gray-700">
                    {ad.title}
                  </Text>
                  <Text size="sm" className="text-gray-500 mt-1">
                    Advertisement
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default AdComponent;
