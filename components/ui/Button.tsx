
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ecru';
  
  const variantClasses = {
    primary: 'bg-oxblood text-ecru hover:bg-oxblood/90 focus:ring-oxblood shadow-elevate',
    secondary: 'bg-brass text-midnight hover:bg-brass/90 focus:ring-brass shadow-md',
    outline: 'border border-brass text-ink hover:bg-brass/10 focus:ring-brass',
    ghost: 'text-ecru hover:bg-white/10 focus:ring-brass',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
