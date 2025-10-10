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
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useBreakpointValue,
  useColorModeValue,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Spinner,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, HamburgerIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { categoriesAPI } from '../services/api';

const TopNavigation = ({ onSearch, onSearchInput, searchQuery, setSearchQuery, onClearSearch, selectedCategory }) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('brand.600', 'brand.400');

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
        <VStack spacing={2} align="stretch" w="full">
          <Text fontSize="sm" fontWeight="bold" color="gray.600" px={2}>
            Categories
          </Text>
          <Button 
            as={Link} 
            to="/" 
            variant="ghost" 
            size="sm"
            onClick={onLinkClick}
            justifyContent="flex-start"
            color={selectedCategory === null ? 'brand.600' : 'gray.600'}
            bg={selectedCategory === null ? 'brand.50' : 'transparent'}
          >
            📰 All Articles
          </Button>
          {categoriesLoading ? (
            <Box p={2} textAlign="center">
              <Spinner size="sm" />
            </Box>
          ) : (
            categories.map((category) => (
              <Button
                key={category.id}
                as={Link}
                to={`/?category=${category.slug}`}
                variant="ghost"
                size="sm"
                onClick={onLinkClick}
                justifyContent="flex-start"
                color={selectedCategory === category.slug ? 'brand.600' : 'gray.600'}
                bg={selectedCategory === category.slug ? 'brand.50' : 'transparent'}
              >
                <Text mr={2}>{category.icon}</Text>
                {category.name}
                <Badge ml="auto" size="xs" colorScheme="gray" variant="subtle">
                  {category.articles_count}
                </Badge>
              </Button>
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
          rightIcon={<ChevronDownIcon />}
          _hover={{ bg: 'brand.50', color: 'brand.600' }}
        >
          Categories
        </MenuButton>
        <MenuList>
          <MenuItem as={Link} to="/" onClick={onLinkClick}>
            <Text mr={2}>📰</Text>
            All Articles
          </MenuItem>
          <MenuDivider />
          {categoriesLoading ? (
            <MenuItem isDisabled>
              <Spinner size="sm" mr={2} />
              Loading...
            </MenuItem>
          ) : (
            categories.map((category) => (
              <MenuItem
                key={category.id}
                as={Link}
                to={`/?category=${category.slug}`}
                onClick={onLinkClick}
              >
                <Text mr={2}>{category.icon}</Text>
                <Text flex="1">{category.name}</Text>
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

  const NavigationLinks = ({ isVertical = false, onLinkClick }) => (
    <>
      <Button 
        as={Link} 
        to="/" 
        variant="ghost" 
        size="sm"
        onClick={onLinkClick}
        _hover={{ bg: 'brand.50', color: 'brand.600' }}
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
        _hover={{ bg: 'brand.50', color: 'brand.600' }}
      >
        Contact Us
      </Button>
      <Button 
        as={Link} 
        to="/admin/login" 
        colorScheme="brand" 
        size="sm"
        onClick={onLinkClick}
      >
        Login
      </Button>
    </>
  );

  return (
    <Box 
      className="site-header" 
      bg={bgColor} 
      shadow="sm" 
      borderBottom="1px" 
      borderColor={borderColor}
      position="sticky"
      top="0"
      zIndex="1000"
    >
      <Container maxW="container.xl" py={4}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          {/* Logo */}
          <Heading 
            size="lg" 
            className="site-title" 
            color={textColor}
            cursor="pointer"
            onClick={() => navigate('/')}
            _hover={{ color: 'brand.500' }}
          >
            Dhivehinoos.net
          </Heading>

          {/* Desktop Navigation */}
          {!isMobile && (
            <HStack spacing={4} flex="1" justify="center">
              <NavigationLinks />
            </HStack>
          )}

          {/* Search Bar - Desktop */}
          {!isMobile && (
            <Box minW="300px" maxW="400px" flex="1">
              <form onSubmit={handleSearch}>
                <InputGroup size="sm">
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    borderRadius="md"
                    borderColor="gray.300"
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                    }}
                  />
                  <InputRightElement>
                    {searchQuery && (
                      <IconButton
                        aria-label="Clear search"
                        icon={<Text>✕</Text>}
                        size="sm"
                        variant="ghost"
                        onClick={onClearSearch}
                        mr={1}
                      />
                    )}
                    <IconButton
                      aria-label="Search"
                      icon={<SearchIcon />}
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
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={onOpen}
            />
          )}
        </Flex>

        {/* Mobile Search Bar */}
        {isMobile && (
          <Box mt={4}>
            <form onSubmit={handleSearch}>
              <InputGroup size="sm">
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  borderRadius="md"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                  }}
                />
                <InputRightElement>
                  {searchQuery && (
                    <IconButton
                      aria-label="Clear search"
                      icon={<Text>✕</Text>}
                      size="sm"
                      variant="ghost"
                      onClick={onClearSearch}
                      mr={1}
                    />
                  )}
                  <IconButton
                    aria-label="Search"
                    icon={<SearchIcon />}
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
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
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
