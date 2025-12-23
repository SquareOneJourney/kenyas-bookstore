import React, { ReactNode } from 'react';
import { Link, LinkProps } from 'react-router-dom';

export const Breadcrumb: React.FC<{ children: ReactNode }> = ({ children }) => (
  <nav aria-label="Breadcrumb">
    <ol className="flex items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
      {children}
    </ol>
  </nav>
);

export const BreadcrumbList: React.FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;

export const BreadcrumbItem: React.FC<{ children: ReactNode, className?: string }> = ({ children, className }) => (
  <li className={`inline-flex items-center gap-1.5 ${className}`}>{children}</li>
);

export const BreadcrumbLink: React.FC<LinkProps> = (props) => (
  <Link {...props} className="transition-colors hover:text-deep-blue" />
);

export const BreadcrumbPage: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span className="font-normal text-deep-blue" role="link" aria-disabled="true" aria-current="page">
    {children}
  </span>
);

export const BreadcrumbSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <li role="presentation" aria-hidden="true" className={className}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  </li>
);