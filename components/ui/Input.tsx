
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
  const baseClasses = 'w-full px-3 py-2 bg-white border border-accent rounded-md text-deep-blue placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-colors';
  
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-deep-blue mb-1">{label}</label>}
      <input id={id} className={`${baseClasses} ${className}`} {...props} />
    </div>
  );
};

export default Input;
