import clsx from 'clsx';

export const Flex = ({ 
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'flex-start',
  wrap = 'nowrap',
  gap,
  className,
  ...props 
}) => {
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'column-reverse': 'flex-col-reverse',
  };
  
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };
  
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };
  
  const wrapClasses = {
    nowrap: 'flex-nowrap',
    wrap: 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
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
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        wrapClasses[wrap],
        gapClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// HStack - horizontal stack
export const HStack = ({ 
  children,
  spacing = 4,
  align = 'center',
  className,
  ...props 
}) => {
  return (
    <Flex
      direction="row"
      align={align}
      gap={spacing}
      className={className}
      {...props}
    >
      {children}
    </Flex>
  );
};

// VStack - vertical stack
export const VStack = ({ 
  children,
  spacing = 4,
  align = 'stretch',
  className,
  ...props 
}) => {
  return (
    <Flex
      direction="column"
      align={align}
      gap={spacing}
      className={className}
      {...props}
    >
      {children}
    </Flex>
  );
};

