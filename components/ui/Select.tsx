
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, className = '', children, ...props }) => {
  const baseClasses = 'w-full px-3 py-2 bg-white border border-accent rounded-md text-deep-blue focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-colors appearance-none bg-no-repeat bg-right pr-8';
  const customBg = `bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23102840" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')]`;

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-deep-blue mb-1">{label}</label>}
      <select id={id} className={`${baseClasses} ${customBg} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
};

export default Select;
