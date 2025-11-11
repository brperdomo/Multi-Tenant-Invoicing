'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isOrganization = user.role === 'organization';
  const baseUrl = isOrganization ? '/organization' : '/facility';

  const navItems = isOrganization
    ? [
        { href: `${baseUrl}/dashboard`, label: 'Dashboard' },
        { href: `${baseUrl}/facilities`, label: 'Facilities' },
        { href: `${baseUrl}/invoices`, label: 'Invoices' },
        { href: `${baseUrl}/payments`, label: 'Payments' },
      ]
    : [
        { href: `${baseUrl}/dashboard`, label: 'Dashboard' },
        { href: `${baseUrl}/invoices`, label: 'Invoices' },
      ];

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href={`${baseUrl}/dashboard`} className="text-xl font-bold">
              Aviata Health Group
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:bg-primary-500'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">{user.name}</span>
            <span className="text-xs bg-primary-700 px-2 py-1 rounded">
              {isOrganization ? 'Organization' : 'Facility'}
            </span>
            <button
              onClick={logout}
              className="bg-primary-700 hover:bg-primary-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
