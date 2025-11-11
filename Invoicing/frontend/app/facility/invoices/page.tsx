'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: string;
  billing_period: string;
  period_start: string;
  period_end: string;
  notes?: string;
  file_path?: string;
  created_at: string;
}

export default function FacilityInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: '',
    notes: '',
  });
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

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

  const handleUploadPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentFile) {
      alert('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('invoice_id', selectedInvoice.id.toString());
      formData.append('payment_date', paymentForm.payment_date);
      formData.append('payment_method', paymentForm.payment_method);
      formData.append('reference_number', paymentForm.reference_number);
      formData.append('notes', paymentForm.notes);
      formData.append('payment_file', paymentFile);

      await api.uploadPaymentProof(formData);
      setShowPaymentModal(false);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        reference_number: '',
        notes: '',
      });
      setPaymentFile(null);
      setSelectedInvoice(null);
      fetchInvoices();
      alert('Payment proof uploaded successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload payment proof');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewInvoice = (filePath: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${filePath}`, '_blank');
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        </div>

        <div className="card">
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(Number(invoice.amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <span className="font-medium">{invoice.billing_period}</span>
                          <br />
                          <span className="text-xs">
                            {new Date(invoice.period_start).toLocaleDateString()} -{' '}
                            {new Date(invoice.period_end).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {invoice.file_path && (
                          <button
                            onClick={() => handleViewInvoice(invoice.file_path!)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </button>
                        )}
                        {invoice.status === 'pending' && (
                          <button
                            onClick={() => handleUploadPayment(invoice)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Upload Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No invoices yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Upload Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Payment Proof</h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Invoice Details</h3>
              <p className="text-sm text-gray-600 mt-2">
                Invoice #: {selectedInvoice.invoice_number}
              </p>
              <p className="text-sm text-gray-600">
                Amount: {formatCurrency(Number(selectedInvoice.amount))}
              </p>
              <p className="text-sm text-gray-600">
                Due Date: {new Date(selectedInvoice.due_date).toLocaleDateString()}
              </p>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.payment_date}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, payment_date: e.target.value })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Payment Method</label>
                  <input
                    type="text"
                    value={paymentForm.payment_method}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, payment_method: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., Bank Transfer, Check"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Reference Number</label>
                  <input
                    type="text"
                    value={paymentForm.reference_number}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, reference_number: e.target.value })
                    }
                    className="input-field"
                    placeholder="Transaction ID or Check Number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Payment Proof File *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                    className="input-field"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload receipt, bank statement, or proof of payment
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Additional notes about the payment"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInvoice(null);
                    setPaymentFile(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Upload Payment Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
