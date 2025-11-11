'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Stats {
  overall: {
    total_invoices: number;
    pending_count: number;
    paid_count: number;
    overdue_count: number;
    disputed_count: number;
    total_amount: number;
    pending_amount: number;
    paid_amount: number;
  };
  by_facility: Array<{
    id: number;
    name: string;
    invoice_count: number;
    paid_count: number;
    total_amount: number;
    paid_amount: number;
  }>;
}

export default function OrganizationDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getInvoiceStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout requiredRole="organization">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link href="/organization/invoices" className="btn-primary">
            Create Invoice
          </Link>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="text-sm font-medium text-gray-600">Total Invoices</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats?.overall.total_invoices || 0}
            </p>
          </div>

          <div className="card bg-yellow-50 border border-yellow-200">
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats?.overall.pending_count || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatCurrency(Number(stats?.overall.pending_amount) || 0)}
            </p>
          </div>

          <div className="card bg-green-50 border border-green-200">
            <h3 className="text-sm font-medium text-gray-600">Paid</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats?.overall.paid_count || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatCurrency(Number(stats?.overall.paid_amount) || 0)}
            </p>
          </div>

          <div className="card bg-red-50 border border-red-200">
            <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats?.overall.overdue_count || 0}
            </p>
          </div>
        </div>

        {/* Facility Breakdown */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Facility Payment Status</h2>

          {stats?.by_facility && stats.by_facility.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Invoices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Invoices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.by_facility.map((facility) => {
                    const paymentRate = facility.invoice_count > 0
                      ? (facility.paid_count / facility.invoice_count) * 100
                      : 0;

                    return (
                      <tr key={facility.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {facility.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {facility.invoice_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {facility.paid_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(Number(facility.total_amount) || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(Number(facility.paid_amount) || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              paymentRate === 100
                                ? 'bg-green-100 text-green-800'
                                : paymentRate >= 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {paymentRate.toFixed(0)}% Paid
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No facilities created yet</p>
              <Link href="/organization/facilities" className="btn-primary mt-4 inline-block">
                Create First Facility
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
