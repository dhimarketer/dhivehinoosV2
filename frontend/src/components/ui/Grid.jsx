import clsx from 'clsx';
import { useState, useEffect } from 'react';

export const Grid = ({ 
  children,
  templateColumns,
  gap = 4,
  className,
  ...props 
}) => {
  const gridColsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  };
  
  const gapMap = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  };
  const gapClasses = gap ? gapMap[gap] || `gap-${gap}` : '';
  
  return (
    <div
      className={clsx(
        'grid',
        templateColumns && gridColsClasses[templateColumns],
        gapClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const GridItem = ({ 
  children,
  colSpan,
  rowSpan,
  className,
  ...props 
}) => {
  const colSpanClasses = colSpan ? `col-span-${colSpan}` : '';
  const rowSpanClasses = rowSpan ? `row-span-${rowSpan}` : '';
  
  return (
    <div
      className={clsx(
        colSpanClasses,
        rowSpanClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const SimpleGrid = ({ 
  children,
  columns = { base: 1, md: 2, lg: 3 },
  spacing = 4,
  className,
  ...props 
}) => {
  // Convert responsive columns to Tailwind classes
  const baseCols = columns.base || 1;
  const smCols = columns.sm || baseCols;
  const mdCols = columns.md || smCols;
  const lgCols = columns.lg || mdCols;
  
  // Track window width for inline style fallback
  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth;
    return 1024; // Default to desktop
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Build responsive grid classes
  const gridClasses = [];
  
  // Base (mobile)
  if (baseCols === 1) gridClasses.push('grid-cols-1');
  else if (baseCols === 2) gridClasses.push('grid-cols-2');
  else if (baseCols === 3) gridClasses.push('grid-cols-3');
  else if (baseCols === 4) gridClasses.push('grid-cols-4');
  else if (baseCols === 5) gridClasses.push('grid-cols-5');
  else if (baseCols === 6) gridClasses.push('grid-cols-6');
  
  // Small screens (480px+)
  if (smCols !== baseCols) {
    if (smCols === 1) gridClasses.push('sm:grid-cols-1');
    else if (smCols === 2) gridClasses.push('sm:grid-cols-2');
    else if (smCols === 3) gridClasses.push('sm:grid-cols-3');
    else if (smCols === 4) gridClasses.push('sm:grid-cols-4');
    else if (smCols === 5) gridClasses.push('sm:grid-cols-5');
    else if (smCols === 6) gridClasses.push('sm:grid-cols-6');
  }
  
  // Medium screens (768px+) - always apply if different from base or sm
  // This ensures md breakpoint classes are always applied when needed
  if (mdCols !== baseCols || mdCols !== smCols) {
    if (mdCols === 1) gridClasses.push('md:grid-cols-1');
    else if (mdCols === 2) gridClasses.push('md:grid-cols-2');
    else if (mdCols === 3) gridClasses.push('md:grid-cols-3');
    else if (mdCols === 4) gridClasses.push('md:grid-cols-4');
    else if (mdCols === 5) gridClasses.push('md:grid-cols-5');
    else if (mdCols === 6) gridClasses.push('md:grid-cols-6');
  }
  
  // Large screens (1024px+) - always apply for desktop to ensure proper grid layout
  // Always add lg classes even if same as md to ensure they're applied on large screens
  if (lgCols === 1) gridClasses.push('lg:grid-cols-1');
  else if (lgCols === 2) gridClasses.push('lg:grid-cols-2');
  else if (lgCols === 3) gridClasses.push('lg:grid-cols-3');
  else if (lgCols === 4) gridClasses.push('lg:grid-cols-4');
  else if (lgCols === 5) gridClasses.push('lg:grid-cols-5');
  else if (lgCols === 6) gridClasses.push('lg:grid-cols-6');
  
  const gapMap = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  };
  
  const gapClasses = gapMap[spacing] || 'gap-4';
  
  // Calculate grid template columns for inline style fallback
  // This ensures grid works even if Tailwind classes don't load
  const getGridTemplateColumns = () => {
    let cols;
    
    if (windowWidth >= 1024) {
      cols = lgCols;
    } else if (windowWidth >= 768) {
      cols = mdCols;
    } else if (windowWidth >= 480) {
      cols = smCols;
    } else {
      cols = baseCols;
    }
    
    return `repeat(${cols}, minmax(0, 1fr))`;
  };
  
  // Debug: Log grid classes in development
  if (import.meta.env.DEV && gridClasses.length === 0) {
    console.warn('SimpleGrid: No grid column classes generated', { columns, baseCols, smCols, mdCols, lgCols });
  }
  
  // Get gap value for inline style
  const gapValue = spacing * 0.25; // Convert spacing (4) to rem (1rem)
  
  return (
    <div
      className={clsx(
        'grid w-full',
        ...gridClasses,
        gapClasses,
        className
      )}
      style={{ 
        display: 'grid',
        gridTemplateColumns: getGridTemplateColumns(),
        gap: `${gapValue}rem`
      }}
      {...props}
    >
      {children}
    </div>
  );
};

