import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Text,
  Image,
  Badge,
  Button,
  VStack,
  HStack,
  IconButton,
  useToast,
  Tooltip,
  Divider,
  Flex,
  Spacer,
  useColorModeValue
} from '@chakra-ui/react';
import { DragHandleIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { adsAPI } from '../services/api';

const AdPlacementMap = ({ ads, adPlacements, onAdUpdate, onRefresh }) => {
  const toast = useToast();
  const [draggedAd, setDraggedAd] = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null);
  
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('blue.50', 'blue.900');

  // Group ads by placement
  const adsByPlacement = ads.reduce((acc, ad) => {
    const placement = ad.placement?.name || 'unplaced';
    if (!acc[placement]) acc[placement] = [];
    acc[placement].push(ad);
    return acc;
  }, {});

  // Define layout zones with their positions
  const layoutZones = [
    {
      id: 'top_banner',
      name: 'Top Banner',
      description: 'Header area above main content',
      position: { row: 1, col: 1, colSpan: 3 },
      color: 'red.100',
      borderColor: 'red.300'
    },
    {
      id: 'sidebar',
      name: 'Sidebar',
      description: 'Right sidebar area',
      position: { row: 2, col: 3, rowSpan: 2 },
      color: 'blue.100',
      borderColor: 'blue.300'
    },
    {
      id: 'between_articles',
      name: 'Between Articles',
      description: 'Between article cards',
      position: { row: 2, col: 1, colSpan: 2 },
      color: 'green.100',
      borderColor: 'green.300'
    },
    {
      id: 'bottom_banner',
      name: 'Bottom Banner',
      description: 'Footer area below content',
      position: { row: 3, col: 1, colSpan: 2 },
      color: 'purple.100',
      borderColor: 'purple.300'
    },
    {
      id: 'article_header',
      name: 'Article Header',
      description: 'Above article content',
      position: { row: 4, col: 1, colSpan: 3 },
      color: 'orange.100',
      borderColor: 'orange.300'
    },
    {
      id: 'article_footer',
      name: 'Article Footer',
      description: 'Below article content',
      position: { row: 5, col: 1, colSpan: 3 },
      color: 'teal.100',
      borderColor: 'teal.300'
    }
  ];

  const handleDragStart = (e, ad) => {
    setDraggedAd(ad);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, zoneId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(zoneId);
  };

  const handleDragLeave = () => {
    setDragOverZone(null);
  };

  const handleDrop = async (e, targetZoneId) => {
    e.preventDefault();
    setDragOverZone(null);
    
    if (!draggedAd) return;

    try {
      // Find the placement ID for the target zone
      const targetPlacement = adPlacements.find(p => p.name === targetZoneId);
      if (!targetPlacement) {
        toast({
          title: 'Invalid placement zone',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Update the ad's placement
      const formData = new FormData();
      formData.append('title', draggedAd.title);
      if (draggedAd.destination_url) {
        formData.append('destination_url', draggedAd.destination_url);
      }
      formData.append('placement_id', targetPlacement.id);
      formData.append('is_active', draggedAd.is_active);
      
      if (draggedAd.start_date) {
        formData.append('start_date', draggedAd.start_date);
      }
      if (draggedAd.end_date) {
        formData.append('end_date', draggedAd.end_date);
      }

      await adsAPI.update(draggedAd.id, formData);
      
      toast({
        title: 'Ad placement updated',
        description: `${draggedAd.title} moved to ${targetPlacement.name}`,
        status: 'success',
        duration: 3000,
      });

      setDraggedAd(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating ad placement:', error);
      toast({
        title: 'Error updating placement',
        description: error.response?.data?.detail || 'Failed to update ad placement',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRemoveAd = async (ad) => {
    try {
      // Instead of deleting the ad, just remove it from placement
      const formData = new FormData();
      formData.append('title', ad.title);
      if (ad.destination_url) {
        formData.append('destination_url', ad.destination_url);
      }
      // Don't append placement_id - this will remove the placement
      formData.append('is_active', ad.is_active);
      
      if (ad.start_date) {
        formData.append('start_date', ad.start_date);
      }
      if (ad.end_date) {
        formData.append('end_date', ad.end_date);
      }

      await adsAPI.update(ad.id, formData);
      
      toast({
        title: 'Ad removed from placement',
        description: `${ad.title} is now unplaced and can be dragged to a new position`,
        status: 'success',
        duration: 3000,
      });

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error removing ad from placement:', error);
      toast({
        title: 'Error removing ad from placement',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const renderAdCard = (ad, isDragging = false) => (
    <Box
      key={ad.id}
      p={2}
      bg="white"
      borderRadius="md"
      border="1px solid"
      borderColor={borderColor}
      shadow="sm"
      opacity={isDragging ? 0.5 : 1}
      cursor="grab"
      draggable
      onDragStart={(e) => handleDragStart(e, ad)}
      _hover={{ shadow: 'md' }}
    >
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
            {ad.title}
          </Text>
          <HStack spacing={1}>
            <Tooltip label="Edit ad">
              <IconButton
                size="xs"
                icon={<EditIcon />}
                onClick={() => onAdUpdate && onAdUpdate(ad)}
                aria-label="Edit ad"
              />
            </Tooltip>
            <Tooltip label="Remove from placement (moves to unplaced)">
              <IconButton
                size="xs"
                icon={<DeleteIcon />}
                onClick={() => handleRemoveAd(ad)}
                aria-label="Remove from placement"
                colorScheme="orange"
                variant="ghost"
              />
            </Tooltip>
          </HStack>
        </HStack>
        
        {ad.image_url ? (
          <Image
            src={ad.image_url}
            alt={ad.title}
            w="100%"
            h="40px"
            objectFit="cover"
            borderRadius="sm"
            fallbackSrc="https://via.placeholder.com/100x40/cccccc/666666?text=No+Image"
          />
        ) : (
          <Box
            w="100%"
            h="40px"
            bg="gray.100"
            borderRadius="sm"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="xs" color="gray.500">
              {ad.title}
            </Text>
          </Box>
        )}
        
        <Badge
          size="sm"
          colorScheme={ad.is_active ? 'green' : 'gray'}
          variant="subtle"
        >
          {ad.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </VStack>
    </Box>
  );

  const renderUnplacedAds = () => {
    const unplacedAds = adsByPlacement.unplaced || [];
    if (unplacedAds.length === 0) return null;

    return (
      <Box
        p={4}
        bg="yellow.50"
        borderRadius="md"
        border="2px dashed"
        borderColor="yellow.300"
        mb={4}
      >
        <Text fontWeight="bold" mb={2} color="yellow.800">
          Unplaced Ads ({unplacedAds.length})
        </Text>
        <Text fontSize="sm" color="yellow.700" mb={3}>
          Drag these ads to placement zones below
        </Text>
        <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={2}>
          {unplacedAds.map(ad => renderAdCard(ad))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Ad Placement Map
          </Text>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Drag ads from the unplaced area or between zones to change their placement. 
            Click the edit icon to modify ad details.
          </Text>
        </Box>

        {renderUnplacedAds()}

        <Box
          p={4}
          bg={bgColor}
          borderRadius="lg"
          border="1px solid"
          borderColor={borderColor}
        >
          <Text fontWeight="bold" mb={4}>
            Website Layout Preview
          </Text>
          
          <Grid
            templateColumns="repeat(3, 1fr)"
            templateRows="repeat(5, 80px)"
            gap={2}
            h="400px"
          >
            {layoutZones.map(zone => {
              const zoneAds = adsByPlacement[zone.id] || [];
              const isDragOver = dragOverZone === zone.id;
              
              return (
                <GridItem
                  key={zone.id}
                  rowStart={zone.position.row}
                  rowEnd={zone.position.row + (zone.position.rowSpan || 1)}
                  colStart={zone.position.col}
                  colEnd={zone.position.col + (zone.position.colSpan || 1)}
                  bg={isDragOver ? hoverBg : zone.color}
                  border="2px dashed"
                  borderColor={isDragOver ? 'blue.400' : zone.borderColor}
                  borderRadius="md"
                  p={2}
                  onDragOver={(e) => handleDragOver(e, zone.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  position="relative"
                  _hover={{ bg: hoverBg }}
                >
                  <VStack spacing={1} h="100%" justify="space-between">
                    <Box textAlign="center">
                      <Text fontSize="xs" fontWeight="bold" color="gray.700">
                        {zone.name}
                      </Text>
                      <Text fontSize="xs" color="gray.600" noOfLines={2}>
                        {zone.description}
                      </Text>
                    </Box>
                    
                    <VStack spacing={1} flex="1" justify="center" w="100%">
                      {zoneAds.length > 0 ? (
                        zoneAds.map(ad => renderAdCard(ad))
                      ) : (
                        <Text fontSize="xs" color="gray.500" textAlign="center">
                          Drop ads here
                        </Text>
                      )}
                    </VStack>
                    
                    <Badge
                      size="sm"
                      colorScheme="blue"
                      variant="subtle"
                    >
                      {zoneAds.length} ad{zoneAds.length !== 1 ? 's' : ''}
                    </Badge>
                  </VStack>
                </GridItem>
              );
            })}
          </Grid>
        </Box>

        <Box p={3} bg="blue.50" borderRadius="md">
          <Text fontSize="sm" color="blue.800">
            💡 <strong>Tip:</strong> Drag ads between zones to change their placement. 
            Use the edit button to modify ad details, or the remove button to unplace ads (they'll move to the unplaced area where you can drag them to new positions).
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default AdPlacementMap;
