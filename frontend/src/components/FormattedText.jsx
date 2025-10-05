import React from 'react';
import { Box } from '@chakra-ui/react';
import { formatTextToHTML } from '../utils/textFormatter';

const FormattedText = ({ 
  content, 
  preview = false, 
  maxLength = 150,
  ...props 
}) => {
  if (!content) return null;

  // For preview mode, use a simpler formatting
  if (preview) {
    const previewText = content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '$1')
      .replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/^#+\s+/gm, '')
      .replace(/^[-*]\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\n+/g, ' ')
      .trim();

    const truncatedText = previewText.length > maxLength 
      ? previewText.substring(0, maxLength).trim() + '...'
      : previewText;

    return (
      <Box {...props}>
        {truncatedText}
      </Box>
    );
  }

  // Full formatting for article content
  const formattedHTML = formatTextToHTML(content);

  return (
    <Box
      dangerouslySetInnerHTML={{ __html: formattedHTML }}
      sx={{
        '& p': { 
          mb: 4, 
          lineHeight: '1.6',
          fontSize: 'md'
        },
        '& h1': { 
          mb: 4, 
          mt: 6, 
          fontSize: '2xl',
          fontWeight: 'bold',
          color: 'gray.800'
        },
        '& h2': { 
          mb: 3, 
          mt: 5, 
          fontSize: 'xl',
          fontWeight: 'bold',
          color: 'gray.800'
        },
        '& h3': { 
          mb: 3, 
          mt: 4, 
          fontSize: 'lg',
          fontWeight: 'bold',
          color: 'gray.800'
        },
        '& strong': { 
          fontWeight: 'bold',
          color: 'gray.800'
        },
        '& em': { 
          fontStyle: 'italic'
        },
        '& del': { 
          textDecoration: 'line-through',
          color: 'gray.500'
        },
        '& code': { 
          backgroundColor: 'gray.100',
          padding: '2px 4px',
          borderRadius: '4px',
          fontSize: 'sm',
          fontFamily: 'mono'
        },
        '& ul': { 
          mb: 4,
          pl: 6
        },
        '& ol': { 
          mb: 4,
          pl: 6
        },
        '& li': { 
          mb: 1,
          lineHeight: '1.5'
        },
        '& a': { 
          color: 'blue.500',
          textDecoration: 'underline',
          _hover: {
            color: 'blue.600'
          }
        },
        '& img': { 
          maxW: '100%', 
          h: 'auto',
          borderRadius: 'md',
          my: 4
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'gray.300',
          pl: 4,
          my: 4,
          fontStyle: 'italic',
          color: 'gray.600'
        }
      }}
      {...props}
    />
  );
};

export default FormattedText;
