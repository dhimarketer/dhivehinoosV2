import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Badge,
  Spinner,
  SimpleGrid,
  Tooltip,
} from './ui';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { categoriesAPI } from '../services/api';

const CategoryNavigation = ({ onCategorySelect, selectedCategory = null }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        const response = await categoriesAPI.getAll();
        // Handle paginated response - extract results array
        const categoriesData = response.data.results || response.data;
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching categories:', err);
        
        // Handle different types of errors
        if (err.code === 'ECONNABORTED') {
          console.warn('Categories request timed out, using empty list');
          setCategories([]); // Use empty array for timeouts
          setError(null); // Don't show error for timeouts
        } else if (err.response?.status >= 500) {
          setError('Server error loading categories');
        } else if (err.response?.status === 404) {
          setCategories([]); // No categories available
          setError(null);
        } else {
          setError('Failed to load categories');
        }
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
      <Box className="p-4 text-center">
        <Spinner size="md" />
        <Text className="mt-2 text-sm text-gray-500">
          Loading categories...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="p-4 text-center">
        <Text className="text-red-500 text-sm">
          {error}
        </Text>
      </Box>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Box className="p-4 text-center">
        <Text size="sm" className="text-gray-500">
          No categories available
        </Text>
      </Box>
    );
  }

  return (
    <Box className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
      <Text size="md" className="font-bold mb-3 text-gray-700">
        Browse by Category
      </Text>
      
      <SimpleGrid columns={{ base: 3, md: 4, lg: 6 }} spacing={2}>
        {/* All Articles Option */}
        <Tooltip label="View all articles" placement="top">
          <Box
            as={RouterLink}
            to="/"
            onClick={() => handleCategoryClick(null)}
            className={`p-2 rounded-md border text-center min-h-[60px] flex flex-col justify-center transition-all cursor-pointer ${
              selectedCategory === null 
                ? 'border-blue-500 bg-blue-50 hover:bg-blue-100' 
                : 'border-transparent hover:bg-gray-50'
            } hover:-translate-y-0.5`}
          >
            <Text className="text-lg mb-1">📰</Text>
            <Text size="xs" className="font-medium">
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
              className={`p-2 rounded-md border text-center min-h-[60px] flex flex-col justify-center transition-all cursor-pointer ${
                selectedCategory === category.slug
                  ? `border-[${category.color}] bg-[${category.color}]/10 hover:bg-[${category.color}]/20`
                  : 'border-transparent hover:bg-gray-50'
              } hover:-translate-y-0.5`}
            >
              <Text className="text-lg mb-1">
                {category.icon}
              </Text>
              <Text size="xs" className="font-medium mb-1 line-clamp-2">
                {category.name}
              </Text>
              <Badge
                size="xs"
                colorScheme="gray"
                variant="subtle"
                className="text-[10px]"
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
