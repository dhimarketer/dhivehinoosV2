import React from 'react';
import { Box, Heading, Text, Flex, VStack, HStack } from './ui';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

/**
 * SidebarWidgets - Newspaper style sidebar components
 * Includes: Social Counter (3x2 grid) and Text-Only List with arrow bullets
 */
const SidebarWidgets = ({ articles = [] }) => {
  // Social media data (can be made configurable later)
  const socialData = [
    { name: 'Facebook', icon: FaFacebook, followers: '12.5K', color: '#1877F2' },
    { name: 'Twitter', icon: FaTwitter, followers: '8.2K', color: '#1DA1F2' },
    { name: 'Instagram', icon: FaInstagram, followers: '15.3K', color: '#E4405F' },
  ];

  return (
    <VStack spacing={6} align="stretch" className="w-full">
      {/* Social Counter Widget */}
      <Box className="bg-white border border-gray-200 p-4" style={{ borderRadius: 0 }}>
        <Heading 
          size="sm" 
          className="mb-4 font-serif font-bold text-black"
          style={{ 
            borderTop: '4px solid #000000',
            borderLeft: '8px solid #000000',
            paddingLeft: '12px',
            paddingTop: '8px'
          }}
        >
          Follow Us
        </Heading>
        <div className="grid grid-cols-3 gap-2">
          {socialData.map((social) => {
            const IconComponent = social.icon;
            return (
              <Box
                key={social.name}
                className="bg-gray-100 p-3 text-center"
                style={{ borderRadius: 0, cursor: 'default' }}
              >
                <IconComponent className="mx-auto mb-2 text-lg" style={{ color: social.color }} />
                <Text className="text-xs font-bold text-black">{social.followers}</Text>
                <Text className="text-[10px] text-gray-600 uppercase">Follow</Text>
              </Box>
            );
          })}
        </div>
      </Box>

      {/* Text-Only List Widget */}
      {articles.length > 0 && (
        <Box className="bg-white border border-gray-200 p-4" style={{ borderRadius: 0 }}>
          <Heading 
            size="sm" 
            className="mb-4 font-serif font-bold text-black"
            style={{ 
              borderTop: '4px solid #000000',
              borderLeft: '8px solid #000000',
              paddingLeft: '12px',
              paddingTop: '8px'
            }}
          >
            Latest Stories
          </Heading>
          <VStack spacing={0} align="stretch" divider={<Box className="border-t border-gray-200" />}>
            {articles.slice(0, 10).map((article, index) => (
              <Link
                key={article.id}
                to={`/article/${article.slug}`}
                className="py-3 px-2 hover:bg-gray-50 transition-colors block"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Text className="text-sm text-black font-sans">
                  <span className="mr-2 text-[#00AEC7]">→</span>
                  {article.title}
                </Text>
              </Link>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default SidebarWidgets;

