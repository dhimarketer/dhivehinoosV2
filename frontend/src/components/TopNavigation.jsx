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
  Divider,
} from './ui';
import { useDisclosure } from '../hooks/useDisclosure';
import { useBreakpointValue } from '../hooks/useBreakpointValue';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, Bars3Icon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
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
            to="/about" 
            variant="ghost" 
            size="sm"
            onClick={onLinkClick}
            className="justify-start hover:bg-brand-50 hover:text-brand-600"
          >
            About
          </Button>
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
                className={`inline-block px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === null 
                    ? 'text-[#00AEC7] font-semibold' 
                    : 'text-black hover:text-[#00AEC7]'
                }`}
                style={{ 
                  fontFamily: 'sans-serif',
                  borderRadius: 0
                }}
        >
          Home
        </Link>
        
        {/* All Categories as Direct Links */}
        {!categoriesLoading && allCategories.length > 0 && (
          <>
            {allCategories.map((category, index) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                onClick={(e) => {
                  if (onLinkClick) {
                    onLinkClick(e);
                  }
                }}
                className={`inline-block px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category.slug 
                    ? 'text-[#00AEC7] font-semibold' 
                    : 'text-black hover:text-[#00AEC7]'
                }`}
                style={{ 
                  fontFamily: 'sans-serif',
                  borderRadius: 0
                }}
              >
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

        {/* Separator before About/Contact */}
        <Box className="h-6 w-px bg-gray-300 mx-2" />

        {/* About Link - Prominent */}
        <Link
          to="/about"
          onClick={(e) => {
            if (onLinkClick) {
              onLinkClick(e);
            }
          }}
          className="inline-block px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap text-[#00AEC7] hover:text-[#00AEC7] border border-black hover:border-[#00AEC7]"
          style={{ 
            fontFamily: 'sans-serif',
            borderRadius: 0
          }}
        >
          About
        </Link>

        {/* Contact Link */}
        <Link
          to="/contact"
          onClick={(e) => {
            if (onLinkClick) {
              onLinkClick(e);
            }
          }}
          className="inline-block px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap text-black hover:text-[#00AEC7]"
          style={{ 
            fontFamily: 'sans-serif',
            borderRadius: 0
          }}
        >
          Contact
        </Link>
      </>
    );
  };

  // Format current date
  const formatDate = () => {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Social media links (can be made configurable later)
  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com', icon: 'f' },
    { name: 'Twitter', url: 'https://twitter.com', icon: 'X' },
    { name: 'Instagram', url: 'https://instagram.com', icon: '📷' },
    { name: 'TikTok', url: 'https://tiktok.com', icon: '🎵' },
  ];

  return (
    <Box 
      className="site-header bg-white sticky top-0 z-[1000] shadow-sm" 
      role="navigation"
    >
      {/* Top Bar: Date and Social Icons - Newspaper Style */}
      <Box className="border-b border-black bg-white">
        <Container className="max-w-newspaper">
          <Flex justify="space-between" align="center" className="py-2">
            <Text size="sm" className="text-black font-sans text-xs">
              {formatDate()}
            </Text>
            <HStack spacing={4}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black hover:text-[#00AEC7] transition-colors text-xs font-sans"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container className="max-w-newspaper">
        {/* Logo Area - Centered, Large, Serif Font */}
        <Box className="text-center py-6">
          <Heading 
            size="xl" 
            className="site-title cursor-pointer hover:opacity-80 transition-opacity font-serif font-bold text-black"
            onClick={() => navigate('/')}
            style={{ 
              fontSize: '2.5rem',
              letterSpacing: '-0.02em'
            }}
          >
            Dhivehinoos
          </Heading>
        </Box>

        {/* Sticky Navbar - Below Logo */}
        <Box className="border-t border-black border-b border-black">
          <Flex justify="space-between" align="center" wrap="wrap" gap={4} className="py-3">
            {/* Navigation Links - Center */}
            {!isMobile && (
              <Box className="flex-1 flex justify-center">
                <NavigationLinks />
              </Box>
            )}

            {/* Utilities - Right: Search Icon and Dark Mode Toggle */}
            <HStack spacing={2} className="flex-shrink-0">
              {/* Search Icon - Desktop */}
              {!isMobile && (
                <IconButton
                  aria-label="Search"
                  icon={MagnifyingGlassIcon}
                  size="sm"
                  variant="ghost"
                  onClick={onOpen}
                  className="text-black hover:text-[#00AEC7]"
                  style={{ borderRadius: 0 }}
                />
              )}
              
              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  aria-label="Open menu"
                  aria-expanded={isOpen}
                  icon={Bars3Icon}
                  variant="ghost"
                  onClick={onOpen}
                  className="text-black"
                  style={{ borderRadius: 0 }}
                />
              )}
            </HStack>
          </Flex>
        </Box>

        {/* Mobile Search Bar */}
        {isMobile && (
          <Box className="mt-4 border-t border-black pt-4">
            <form onSubmit={handleSearch}>
              <InputGroup size="sm">
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{ borderRadius: 0 }}
                  className="border-black focus:border-[#00AEC7] focus:ring-1 focus:ring-[#00AEC7]"
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
                      style={{ borderRadius: 0 }}
                    />
                  )}
                  <IconButton
                    aria-label="Search"
                    icon={MagnifyingGlassIcon}
                    size="sm"
                    variant="ghost"
                    onClick={handleSearch}
                    type="submit"
                    style={{ borderRadius: 0 }}
                  />
                </InputRightElement>
              </InputGroup>
            </form>
          </Box>
        )}
      </Container>

      {/* Mobile Drawer - Menu */}
      {isMobile && (
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
      )}

      {/* Desktop Search Drawer */}
      {!isMobile && (
        <Drawer isOpen={isOpen} onClose={onClose} placement="top">
          <DrawerContent>
            <DrawerCloseButton onClose={onClose} />
            <DrawerBody>
              <Box className="py-4">
                <form onSubmit={handleSearch}>
                  <InputGroup size="lg">
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      style={{ borderRadius: 0 }}
                      className="border-black focus:border-[#00AEC7] focus:ring-1 focus:ring-[#00AEC7] text-lg"
                      autoFocus
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
                          style={{ borderRadius: 0 }}
                        />
                      )}
                      <IconButton
                        aria-label="Search"
                        icon={MagnifyingGlassIcon}
                        size="sm"
                        variant="ghost"
                        onClick={handleSearch}
                        type="submit"
                        style={{ borderRadius: 0 }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </form>
              </Box>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </Box>
  );
};

export default TopNavigation;
