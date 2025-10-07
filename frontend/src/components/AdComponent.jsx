import React, { useState, useEffect } from 'react';
import { Box, Image, Link, Spinner, Text } from '@chakra-ui/react';
import { adsAPI } from '../services/api';
import { trackAdClick } from '../utils/analytics';

const AdComponent = ({ placement, maxAds = 1 }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const params = placement ? { placement, t: Date.now() } : { t: Date.now() };
        const response = await adsAPI.getActive(params);
        const adsData = response.data.results || response.data;
        
        // Limit to maxAds
        const limitedAds = Array.isArray(adsData) ? adsData.slice(0, maxAds) : [];
        setAds(limitedAds);
      } catch (err) {
        console.error('Error fetching ads:', err);
        setError('Failed to load ads');
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
      <Box textAlign="center" p={4}>
        <Spinner size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={4}>
        <Text fontSize="sm" color="gray.500">{error}</Text>
      </Box>
    );
  }

  if (!ads || ads.length === 0) {
    return null; // Don't render anything if no ads
  }

  return (
    <Box>
      {ads.map((ad) => (
        <Box key={ad.id} mb={4}>
          {ad.destination_url ? (
            <Link
              href={ad.destination_url}
              isExternal
              onClick={() => handleAdClick(ad)}
              display="block"
            >
              {ad.image_url ? (
                <Image
                  src={ad.image_url}
                  alt={ad.title}
                  maxW="100%"
                  h="auto"
                  borderRadius="md"
                  _hover={{ opacity: 0.9 }}
                />
              ) : (
                <Box
                  p={4}
                  bg="gray.100"
                  borderRadius="md"
                  textAlign="center"
                  border="2px dashed"
                  borderColor="gray.300"
                >
                  <Text fontWeight="bold" fontSize="lg" color="gray.700">
                    {ad.title}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Click to visit
                  </Text>
                </Box>
              )}
            </Link>
          ) : (
            <Box>
              {ad.image_url ? (
                <Image
                  src={ad.image_url}
                  alt={ad.title}
                  maxW="100%"
                  h="auto"
                  borderRadius="md"
                />
              ) : (
                <Box
                  p={4}
                  bg="gray.100"
                  borderRadius="md"
                  textAlign="center"
                  border="2px dashed"
                  borderColor="gray.300"
                >
                  <Text fontWeight="bold" fontSize="lg" color="gray.700">
                    {ad.title}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
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
