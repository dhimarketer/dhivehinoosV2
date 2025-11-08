import { useState, useEffect } from 'react';

export const useBreakpointValue = (values) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return values.base;
    
    const width = window.innerWidth;
    // Check from largest to smallest, but use nullish coalescing to prefer defined values
    if (width >= 1024) return values.lg ?? values.md ?? values.base;
    if (width >= 768) return values.md ?? values.base;
    return values.base;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setValue(values.lg ?? values.md ?? values.base);
      } else if (width >= 768) {
        setValue(values.md ?? values.base);
      } else {
        setValue(values.base);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [values]);

  return value;
};


