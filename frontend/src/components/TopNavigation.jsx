import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Spinner,
  Badge,
  Tooltip,
} from './ui';
import { useDisclosure } from '../hooks/useDisclosure';
import { useBreakpointValue } from '../hooks/useBreakpointValue';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { categoriesAPI } from '../services/api';

const TopNavigation = ({ onSearch, onSearchInput, searchQuery, setSearchQuery, onClearSearch, selectedCategory }) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoriesAPI.getAll();
        const categoriesData = response.data.results || response.data;
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]); // Set empty array on error
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(e);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearchInput) {
      onSearchInput(value);
    }
  };

  const CategoriesDropdown = ({ isVertical = false, onLinkClick }) => {
    if (isVertical) {
      return (
        <VStack spacing={2} align="stretch" className="w-full">
          <Text size="sm" className="font-bold text-gray-600 px-2">
            Categories
          </Text>
          <Button 
            as={Link} 
            to="/" 
            variant="ghost" 
            size="sm"
            onClick={onLinkClick}
            className={`justify-start ${
              selectedCategory === null 
                ? 'text-brand-600 bg-brand-50' 
                : 'text-gray-600 bg-transparent'
            }`}
          >
            📰 All Articles
          </Button>
          {categoriesLoading ? (
            <Box className="p-2 text-center">
              <Spinner size="sm" />
            </Box>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                onClick={(e) => {
                  if (onLinkClick) {
                    onLinkClick(e);
                  }
                }}
                className={`flex items-center justify-between w-full px-2 py-2 text-sm rounded-md transition-colors ${
                  selectedCategory === category.slug 
                    ? 'text-brand-600 bg-brand-50' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center">
                  <Text className="mr-2">{category.icon}</Text>
                  {category.name}
                </span>
                <Badge size="xs" colorScheme="gray" variant="subtle">
                  {category.articles_count}
                </Badge>
              </Link>
            ))
          )}
        </VStack>
      );
    }

    return (
      <Menu>
        <MenuButton
          as={Button}
          variant="ghost"
          size="sm"
          rightIcon={true}
          className="hover:bg-brand-50 hover:text-brand-600"
        >
          Categories
        </MenuButton>
        <MenuList>
          <MenuItem as={Link} to="/" onClick={onLinkClick}>
            <Text className="mr-2">📰</Text>
            All Articles
          </MenuItem>
          <MenuDivider />
          {categoriesLoading ? (
            <MenuItem className="opacity-50 cursor-not-allowed">
              <Spinner size="sm" className="mr-2" />
              Loading...
            </MenuItem>
          ) : (
            categories.map((category) => (
              <MenuItem
                key={category.id}
                as={Link}
                to={`/category/${category.slug}`}
                onClick={onLinkClick}
              >
                <Text className="mr-2">{category.icon}</Text>
                <Text className="flex-1">{category.name}</Text>
                <Badge size="xs" colorScheme="gray" variant="subtle">
                  {category.articles_count}
                </Badge>
              </MenuItem>
            ))
          )}
        </MenuList>
      </Menu>
    );
  };

  // Get all categories with articles, sorted by article count
  const allCategories = categories
    .filter(cat => cat.articles_count > 0)
    .sort((a, b) => (b.articles_count || 0) - (a.articles_count || 0));

  const NavigationLinks = ({ isVertical = false, onLinkClick }) => {
    if (isVertical) {
      // Mobile: Show all categories in the drawer
      return (
        <>
          <Button 
            as={Link} 
            to="/" 
            variant="ghost" 
            size="sm"
            onClick={onLinkClick}
            className={`justify-start ${
              selectedCategory === null 
                ? 'text-brand-600 bg-brand-50' 
                : 'text-gray-600 bg-transparent'
            }`}
          >
            Home
          </Button>
          <CategoriesDropdown isVertical={isVertical} onLinkClick={onLinkClick} />
          <Button 
            as={Link} 
            to="/contact" 
            variant="ghost" 
            size="sm"
            onClick={onLinkClick}
            className="justify-start hover:bg-brand-50 hover:text-brand-600"
          >
            Contact Us
          </Button>
        </>
      );
    }

    // Desktop: Show all categories as direct links
    return (
      <>
        <Link
          to="/"
          onClick={(e) => {
            if (onLinkClick) {
              onLinkClick(e);
            }
          }}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === null 
              ? 'text-gray-900 border-b-2 border-gray-900' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Home
        </Link>
        
        {/* All Categories as Direct Links */}
        {!categoriesLoading && allCategories.length > 0 && (
          <>
            {allCategories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                onClick={(e) => {
                  if (onLinkClick) {
                    onLinkClick(e);
                  }
                }}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.slug 
                    ? 'text-gray-900 border-b-2 border-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Text className="mr-1.5">{category.icon}</Text>
                {category.name}
              </Link>
            ))}
          </>
        )}

        {/* Fallback: If no categories but categories exist, show dropdown */}
        {!categoriesLoading && allCategories.length === 0 && categories.length > 0 && (
          <CategoriesDropdown isVertical={isVertical} onLinkClick={onLinkClick} />
        )}

        {/* Loading state for categories */}
        {categoriesLoading && (
          <Box className="px-2">
            <Spinner size="sm" />
          </Box>
        )}
      </>
    );
  };

  return (
    <Box 
      className="site-header bg-white border-b border-gray-200 sticky top-0 z-[1000]" 
      role="navigation"
    >
      <Container className="max-w-7xl">
        {/* Top Row: Logo and Search */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4} className="py-3">
          {/* Logo */}
          <Heading 
            size="lg" 
            className="site-title text-gray-900 cursor-pointer hover:text-gray-700 font-bold"
            onClick={() => navigate('/')}
          >
            Dhivehinoos.net
          </Heading>

          {/* Search Bar - Desktop */}
          {!isMobile && (
            <Box className="min-w-[250px] max-w-[350px]">
              <form onSubmit={handleSearch}>
                <InputGroup size="sm">
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="rounded-md border-gray-300 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-gray-50"
                  />
                  <InputRightElement>
                    {searchQuery && (
                      <IconButton
                        aria-label="Clear search"
                        icon={<span className="text-sm">✕</span>}
                        size="sm"
                        variant="ghost"
                        onClick={onClearSearch}
                        className="mr-1"
                      />
                    )}
                    <IconButton
                      aria-label="Search"
                      icon={MagnifyingGlassIcon}
                      size="sm"
                      variant="ghost"
                      onClick={handleSearch}
                      type="submit"
                    />
                  </InputRightElement>
                </InputGroup>
              </form>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              aria-label="Open menu"
              aria-expanded={isOpen}
              icon={Bars3Icon}
              variant="ghost"
              onClick={onOpen}
            />
          )}
        </Flex>

        {/* Desktop Navigation - Categories Row */}
        {!isMobile && (
          <Box className="border-t border-gray-100">
            <Flex justify="center" align="center" wrap="wrap" gap={1} className="py-2">
              <NavigationLinks />
            </Flex>
          </Box>
        )}

        {/* Mobile Search Bar */}
        {isMobile && (
          <Box className="mt-4">
            <form onSubmit={handleSearch}>
              <InputGroup size="sm">
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="rounded-md border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <InputRightElement>
                  {searchQuery && (
                    <IconButton
                      aria-label="Clear search"
                      icon={<span className="text-sm">✕</span>}
                      size="sm"
                      variant="ghost"
                      onClick={onClearSearch}
                      className="mr-1"
                    />
                  )}
                  <IconButton
                    aria-label="Search"
                    icon={MagnifyingGlassIcon}
                    size="sm"
                    variant="ghost"
                    onClick={handleSearch}
                    type="submit"
                  />
                </InputRightElement>
              </InputGroup>
            </form>
          </Box>
        )}
      </Container>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right">
        <DrawerContent>
          <DrawerCloseButton onClose={onClose} />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <NavigationLinks isVertical onLinkClick={onClose} />
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default TopNavigation;
