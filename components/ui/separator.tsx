import React from 'react';

export const Separator: React.FC<{ orientation?: 'horizontal' | 'vertical', className?: string }> = ({ orientation = 'horizontal', className }) => {
  const orientationClasses = orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]';
  return (
    <div className={`shrink-0 bg-gray-300 ${orientationClasses} ${className}`} />
  );
};
