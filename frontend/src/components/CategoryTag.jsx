import React from 'react';
import { Box } from './ui';

/**
 * CategoryTag - Small badge placed over article images
 * Style: Background Cyan Blue (#00AEC7), Text White, Uppercase, extremely small font
 */
const CategoryTag = ({ category, className = '' }) => {
  if (!category) return null;

  return (
    <Box
      className={`absolute top-2 left-2 z-10 bg-[#00AEC7] text-white uppercase text-[10px] font-bold px-2 py-1 ${className}`}
      style={{ 
        borderRadius: 0, // No rounded corners
        maxWidth: 'calc(100% - 16px)', // Ensure it doesn't exceed container width (accounting for left-2 = 8px * 2)
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
    >
      {category.icon && <span className="mr-1">{category.icon}</span>}
      <span style={{ 
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'inline-block',
        maxWidth: '100%'
      }}>
        {category.name}
      </span>
    </Box>
  );
};

export default CategoryTag;

