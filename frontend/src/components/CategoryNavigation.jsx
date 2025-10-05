import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Spinner,
  SimpleGrid,
  useColorModeValue,
  Link as ChakraLink,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { categoriesAPI } from '../services/api';

const CategoryNavigation = ({ onCategorySelect, selectedCategory = null }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoriesAPI.getAll();
        // Handle paginated response - extract results array
        const categoriesData = response.data.results || response.data;
        setCategories(categoriesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categorySlug) => {
    if (onCategorySelect) {
      onCategorySelect(categorySlug);
    }
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="md" />
        <Text mt={2} fontSize="sm" color="gray.500">
          Loading categories...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Text color="red.500" fontSize="sm">
          {error}
        </Text>
      </Box>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text fontSize="sm" color="gray.500">
          No categories available
        </Text>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={3}
      mb={4}
    >
      <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
        Browse by Category
      </Text>
      
      <SimpleGrid columns={{ base: 3, md: 4, lg: 6 }} spacing={2}>
        {/* All Articles Option */}
        <Tooltip label="View all articles" placement="top">
          <Box
            as={RouterLink}
            to="/"
            onClick={() => handleCategoryClick(null)}
            p={2}
            borderRadius="md"
            border="1px"
            borderColor={selectedCategory === null ? 'blue.500' : 'transparent'}
            bg={selectedCategory === null ? 'blue.50' : 'transparent'}
            _hover={{
              bg: selectedCategory === null ? 'blue.100' : hoverBg,
              transform: 'translateY(-1px)',
            }}
            transition="all 0.2s"
            cursor="pointer"
            textAlign="center"
            minH="60px"
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Text fontSize="lg" mb={1}>📰</Text>
            <Text fontSize="xs" fontWeight="medium">
              All
            </Text>
          </Box>
        </Tooltip>

        {/* Category Options */}
        {categories.map((category) => (
          <Tooltip key={category.id} label={category.description} placement="top">
            <Box
              as={RouterLink}
              to={`/?category=${category.slug}`}
              onClick={() => handleCategoryClick(category.slug)}
              p={2}
              borderRadius="md"
              border="1px"
              borderColor={selectedCategory === category.slug ? category.color : 'transparent'}
              bg={selectedCategory === category.slug ? `${category.color}10` : 'transparent'}
              _hover={{
                bg: selectedCategory === category.slug ? `${category.color}20` : hoverBg,
                transform: 'translateY(-1px)',
              }}
              transition="all 0.2s"
              cursor="pointer"
              textAlign="center"
              minH="60px"
              display="flex"
              flexDirection="column"
              justifyContent="center"
            >
              <Text fontSize="lg" mb={1}>
                {category.icon}
              </Text>
              <Text fontSize="xs" fontWeight="medium" mb={1} noOfLines={2}>
                {category.name}
              </Text>
              <Badge
                size="xs"
                colorScheme="gray"
                variant="subtle"
                fontSize="2xs"
              >
                {category.articles_count}
              </Badge>
            </Box>
          </Tooltip>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default CategoryNavigation;
