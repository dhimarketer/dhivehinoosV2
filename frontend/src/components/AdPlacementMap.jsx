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
  useColorModeValue,
  Center,
  SimpleGrid
} from '@chakra-ui/react';
import { DragHandleIcon, DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';
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

  // Define layout zones with their positions (4-column grid)
  const layoutZones = [
    {
      id: 'top_banner',
      name: 'Top Banner',
      description: 'Header area above main content',
      position: { row: 1, col: 1, colSpan: 4 },
      color: 'red.50',
      borderColor: 'red.300'
    },
    {
      id: 'sidebar',
      name: 'Sidebar',
      description: 'Right sidebar area',
      position: { row: 2, col: 4, rowSpan: 3 },
      color: 'blue.50',
      borderColor: 'blue.300'
    },
    {
      id: 'between_articles',
      name: 'Between Articles',
      description: 'Between article cards',
      position: { row: 2, col: 1, colSpan: 3 },
      color: 'green.50',
      borderColor: 'green.300'
    },
    {
      id: 'bottom_banner',
      name: 'Bottom Banner',
      description: 'Footer area below content',
      position: { row: 3, col: 1, colSpan: 3 },
      color: 'purple.50',
      borderColor: 'purple.300'
    },
    {
      id: 'article_header',
      name: 'Article Header',
      description: 'Above article content',
      position: { row: 4, col: 1, colSpan: 4 },
      color: 'orange.50',
      borderColor: 'orange.300'
    },
    {
      id: 'article_footer',
      name: 'Article Footer',
      description: 'Below article content',
      position: { row: 5, col: 1, colSpan: 4 },
      color: 'teal.50',
      borderColor: 'teal.300'
    }
  ];

  const handleDragStart = (e, ad) => {
    setDraggedAd(ad);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Create a custom drag image for better visual feedback
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.border = '2px solid #3182ce';
    dragImage.style.borderRadius = '8px';
    dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up the drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  const handleDragOver = (e, zoneId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(zoneId);
  };

  const handleDragLeave = (e) => {
    // Only clear drag over zone if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverZone(null);
    }
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

  const renderAdCard = (ad, isDragging = false, size = 'normal') => {
    const isSmall = size === 'small';
    const cardPadding = isSmall ? 1 : 2;
    const imageHeight = isSmall ? '30px' : '50px';
    const fontSize = isSmall ? '2xs' : 'xs';
    
    return (
      <Box
        key={ad.id}
        p={cardPadding}
        bg="white"
        borderRadius="lg"
        border="2px solid"
        borderColor={isDragging ? 'blue.400' : borderColor}
        shadow={isDragging ? 'lg' : 'sm'}
        opacity={isDragging ? 0.7 : 1}
        cursor="grab"
        draggable
        onDragStart={(e) => handleDragStart(e, ad)}
        _hover={{ 
          shadow: 'md',
          borderColor: 'blue.300',
          transform: 'translateY(-1px)'
        }}
        transition="all 0.2s ease"
        position="relative"
        group
      >
        {/* Drag handle indicator */}
        <Box
          position="absolute"
          top="2px"
          right="2px"
          opacity={0}
          _groupHover={{ opacity: 1 }}
          transition="opacity 0.2s"
        >
          <DragHandleIcon boxSize={2} color="gray.400" />
        </Box>
        
        <VStack spacing={isSmall ? 1 : 2} align="stretch">
          <HStack justify="space-between" spacing={1}>
            <Text 
              fontSize={fontSize} 
              fontWeight="bold" 
              noOfLines={1}
              color="gray.700"
            >
              {ad.title}
            </Text>
            <HStack spacing={0.5}>
              <Tooltip label="Edit ad">
                <IconButton
                  size="2xs"
                  icon={<EditIcon />}
                  onClick={() => onAdUpdate && onAdUpdate(ad)}
                  aria-label="Edit ad"
                  variant="ghost"
                  colorScheme="blue"
                />
              </Tooltip>
              <Tooltip label="Remove from placement">
                <IconButton
                  size="2xs"
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
              h={imageHeight}
              objectFit="cover"
              borderRadius="md"
              fallbackSrc="https://via.placeholder.com/100x40/cccccc/666666?text=No+Image"
            />
          ) : (
            <Box
              w="100%"
              h={imageHeight}
              bg="gray.100"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="1px dashed"
              borderColor="gray.300"
            >
              <Text fontSize={fontSize} color="gray.500" textAlign="center">
                {ad.title}
              </Text>
            </Box>
          )}
          
          <Badge
            size="sm"
            colorScheme={ad.is_active ? 'green' : 'gray'}
            variant="subtle"
            fontSize={fontSize}
            alignSelf="center"
          >
            {ad.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </VStack>
      </Box>
    );
  };

  const renderUnplacedAds = () => {
    const unplacedAds = adsByPlacement.unplaced || [];
    if (unplacedAds.length === 0) return null;

    return (
      <Box
        p={4}
        bg="yellow.50"
        borderRadius="lg"
        border="2px dashed"
        borderColor="yellow.300"
        mb={6}
        shadow="sm"
      >
        <HStack justify="space-between" mb={3}>
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" color="yellow.800" fontSize="md">
              📦 Unplaced Ads ({unplacedAds.length})
            </Text>
            <Text fontSize="sm" color="yellow.700">
              Drag these ads to placement zones below
            </Text>
          </VStack>
          <Badge colorScheme="yellow" variant="solid" fontSize="xs">
            {unplacedAds.length} available
          </Badge>
        </HStack>
        
        <SimpleGrid 
          columns={{ base: 2, sm: 3, md: 4, lg: 6 }} 
          spacing={3}
          minChildWidth="120px"
        >
          {unplacedAds.map(ad => renderAdCard(ad, false, 'small'))}
        </SimpleGrid>
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
          p={6}
          bg={bgColor}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          shadow="md"
        >
          <HStack justify="space-between" mb={6}>
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="lg" color="gray.700">
                🗺️ Website Layout Preview
              </Text>
              <Text fontSize="sm" color="gray.600">
                Drag ads from above to place them in different areas
              </Text>
            </VStack>
            <Badge colorScheme="blue" variant="subtle" fontSize="sm">
              {ads.filter(ad => ad.placement).length} ads placed
            </Badge>
          </HStack>
          
          <Grid
            templateColumns="repeat(4, 1fr)"
            templateRows="repeat(6, 100px)"
            gap={3}
            h="600px"
            p={2}
          >
            {layoutZones.map(zone => {
              const zoneAds = adsByPlacement[zone.id] || [];
              const isDragOver = dragOverZone === zone.id;
              const hasAds = zoneAds.length > 0;
              
              return (
                <GridItem
                  key={zone.id}
                  rowStart={zone.position.row}
                  rowEnd={zone.position.row + (zone.position.rowSpan || 1)}
                  colStart={zone.position.col}
                  colEnd={zone.position.col + (zone.position.colSpan || 1)}
                  bg={isDragOver ? 'blue.100' : hasAds ? 'white' : zone.color}
                  border="3px dashed"
                  borderColor={isDragOver ? 'blue.500' : hasAds ? 'green.300' : zone.borderColor}
                  borderRadius="xl"
                  p={3}
                  onDragOver={(e) => handleDragOver(e, zone.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  position="relative"
                  _hover={{ 
                    bg: isDragOver ? 'blue.100' : 'blue.50',
                    borderColor: 'blue.400',
                    transform: 'scale(1.02)'
                  }}
                  transition="all 0.2s ease"
                  cursor="pointer"
                  minH="100px"
                >
                  <VStack spacing={2} h="100%" justify="space-between">
                    {/* Zone Header */}
                    <Box textAlign="center" flex="0 0 auto">
                      <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={1}>
                        {zone.name}
                      </Text>
                      <Text fontSize="xs" color="gray.600" noOfLines={2}>
                        {zone.description}
                      </Text>
                    </Box>
                    
                    {/* Ads Container */}
                    <Box 
                      flex="1" 
                      w="100%" 
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      minH="40px"
                    >
                      {zoneAds.length > 0 ? (
                        <VStack spacing={1} w="100%">
                          {zoneAds.map(ad => renderAdCard(ad, false, 'small'))}
                        </VStack>
                      ) : (
                        <Center h="100%" w="100%">
                          <VStack spacing={1}>
                            <AddIcon boxSize={4} color="gray.400" />
                            <Text 
                              fontSize="xs" 
                              color={isDragOver ? 'blue.600' : 'gray.500'} 
                              textAlign="center"
                              fontWeight={isDragOver ? 'bold' : 'normal'}
                            >
                              {isDragOver ? 'Drop here!' : 'Drop ads here'}
                            </Text>
                          </VStack>
                        </Center>
                      )}
                    </Box>
                    
                    {/* Zone Footer */}
                    <Box flex="0 0 auto" w="100%">
                      <HStack justify="space-between">
                        <Badge
                          size="sm"
                          colorScheme={hasAds ? 'green' : 'gray'}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {zoneAds.length} ad{zoneAds.length !== 1 ? 's' : ''}
                        </Badge>
                        {hasAds && (
                          <Badge
                            size="sm"
                            colorScheme="green"
                            variant="solid"
                            fontSize="xs"
                          >
                            ✓ Active
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  </VStack>
                </GridItem>
              );
            })}
          </Grid>
        </Box>

        <Box p={4} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.200">
          <HStack spacing={3}>
            <Text fontSize="lg">💡</Text>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="bold" color="blue.800">
                How to use the Ad Placement Map:
              </Text>
              <VStack align="start" spacing={1} fontSize="sm" color="blue.700">
                <Text>• <strong>Drag & Drop:</strong> Drag ads from the unplaced area or between zones to change their placement</Text>
                <Text>• <strong>Edit:</strong> Click the edit button (pencil icon) to modify ad details</Text>
                <Text>• <strong>Remove:</strong> Click the remove button (trash icon) to unplace ads (they'll move back to unplaced area)</Text>
                <Text>• <strong>Visual Feedback:</strong> Zones highlight when you hover or drag over them</Text>
              </VStack>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default AdPlacementMap;
