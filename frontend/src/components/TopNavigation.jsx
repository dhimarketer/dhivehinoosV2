import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, HamburgerIcon } from '@chakra-ui/icons';

const TopNavigation = ({ onSearch, onSearchInput, searchQuery, setSearchQuery, onClearSearch }) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('brand.600', 'brand.400');

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
