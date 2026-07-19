import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 text-sm text-gray-400">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.to ? (
              <Link
                to={item.to}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-white">{item.label}</span>
            )}

            {index < items.length - 1 && (
              <ChevronRight className="w-4 h-4" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
