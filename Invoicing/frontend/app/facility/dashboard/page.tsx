'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: string;
  billing_period: string;
}

export default function FacilityDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await api.getAllInvoices();
      setInvoices(data.invoices);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === 'pending').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + Number(i.amount), 0),
    pendingAmount: invoices
      .filter((i) => i.status === 'pending')
      .reduce((sum, i) => sum + Number(i.amount), 0),
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="facility">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="facility">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link href="/facility/invoices" className="btn-primary">
            View All Invoices
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="text-sm font-medium text-gray-600">Total Invoices</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
          </div>

          <div className="card bg-yellow-50 border border-yellow-200">
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            <p className="text-sm text-gray-600 mt-1">{formatCurrency(stats.pendingAmount)}</p>
          </div>

          <div className="card bg-green-50 border border-green-200">
            <h3 className="text-sm font-medium text-gray-600">Paid</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.paid}</p>
          </div>

          <div className="card bg-red-50 border border-red-200">
            <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Invoices</h2>

          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold text-gray-900">{formatCurrency(Number(invoice.amount))}</p>
                    <p className="text-sm text-gray-500">{invoice.billing_period}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invoice.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No invoices yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
