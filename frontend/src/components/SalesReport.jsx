import { forwardRef } from 'react';
import Logo from '../assets/Logo.png';

const SalesReport = forwardRef(({ sales, dateRange, user }, ref) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate totals
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const completedSales = sales.filter(s => s.status === 'completed').length;
  const pendingSales = sales.filter(s => s.status === 'pending').length;

  // Group by payment method
  const paymentMethodStats = sales.reduce((acc, sale) => {
    if (!acc[sale.paymentMethod]) {
      acc[sale.paymentMethod] = { count: 0, total: 0 };
    }
    acc[sale.paymentMethod].count++;
    acc[sale.paymentMethod].total += sale.total;
    return acc;
  }, {});

  return (
    <div ref={ref} className="bg-white text-black p-8 max-w-[210mm] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Unicorn EV Bikes" className="w-12 h-12 object-contain" style={{ maxWidth: '48px', maxHeight: '48px' }} />
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontSize: '20px', lineHeight: '1.2', marginBottom: '2px' }}>Unicorn EV Bikes</h1>
              <p className="text-xs text-gray-600" style={{ fontSize: '10px' }}>Electric Mobility Solutions</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontSize: '20px', lineHeight: '1.2', marginBottom: '2px' }}>SALES REPORT</h2>
            <p className="text-xs text-gray-600" style={{ fontSize: '10px' }}>Generated: {formatDate(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Report Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">Report Details</h3>
          <div className="text-xs text-gray-700 space-y-1">
            <p><span className="font-semibold">Sales Person:</span> {user?.username}</p>
            <p><span className="font-semibold">Email:</span> {user?.email}</p>
            <p><span className="font-semibold">Period:</span> {dateRange || 'All Time'}</p>
            <p><span className="font-semibold">Total Records:</span> {totalSales}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">Company Info</h3>
          <div className="text-xs text-gray-700 space-y-1">
            <p className="font-semibold">Unicorn EV Bikes</p>
            <p>123 Main Street, Karachi</p>
            <p>Sindh 75500, Pakistan</p>
            <p>Phone: +92 300 1234567</p>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Summary Statistics</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-300 rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-cyan-700">{totalSales}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-blue-700">{completedSales}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-700">{pendingSales}</p>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Payment Method Breakdown</h3>
        <table className="w-full border-collapse" style={{ pageBreakInside: 'avoid' }}>
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-400 py-2 px-3 text-left text-xs font-bold">Payment Method</th>
              <th className="border border-gray-400 py-2 px-3 text-center text-xs font-bold">Count</th>
              <th className="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Total Amount</th>
              <th className="border border-gray-400 py-2 px-3 text-right text-xs font-bold">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(paymentMethodStats).map(([method, stats], index) => (
              <tr key={method} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 py-2 px-3 text-xs font-medium">{method}</td>
                <td className="border border-gray-300 py-2 px-3 text-center text-xs">{stats.count}</td>
                <td className="border border-gray-300 py-2 px-3 text-right text-xs font-semibold">{formatCurrency(stats.total)}</td>
                <td className="border border-gray-300 py-2 px-3 text-right text-xs">{((stats.total / totalRevenue) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="bg-gray-800 text-white font-bold">
              <td className="border border-gray-400 py-2 px-3 text-xs">TOTAL</td>
              <td className="border border-gray-400 py-2 px-3 text-center text-xs">{totalSales}</td>
              <td className="border border-gray-400 py-2 px-3 text-right text-xs">{formatCurrency(totalRevenue)}</td>
              <td className="border border-gray-400 py-2 px-3 text-right text-xs">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sales Details Table */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3 border-b-2 border-gray-300 pb-1">Detailed Sales Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-400 py-2 px-2 text-left font-bold" style={{ width: '12%' }}>Invoice</th>
                <th className="border border-gray-400 py-2 px-2 text-left font-bold" style={{ width: '10%' }}>Date</th>
                <th className="border border-gray-400 py-2 px-2 text-left font-bold" style={{ width: '18%' }}>Customer</th>
                <th className="border border-gray-400 py-2 px-2 text-left font-bold" style={{ width: '15%' }}>Model</th>
                <th className="border border-gray-400 py-2 px-2 text-center font-bold" style={{ width: '6%' }}>Qty</th>
                <th className="border border-gray-400 py-2 px-2 text-right font-bold" style={{ width: '12%' }}>Amount</th>
                <th className="border border-gray-400 py-2 px-2 text-center font-bold" style={{ width: '12%' }}>Payment</th>
                <th className="border border-gray-400 py-2 px-2 text-center font-bold" style={{ width: '10%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, index) => (
                <tr key={sale._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} style={{ pageBreakInside: 'avoid' }}>
                  <td className="border border-gray-300 py-2 px-2 font-mono text-xs">{sale.invoiceId}</td>
                  <td className="border border-gray-300 py-2 px-2 text-xs">{formatDate(sale.createdAt)}</td>
                  <td className="border border-gray-300 py-2 px-2 text-xs">{sale.customer}</td>
                  <td className="border border-gray-300 py-2 px-2 text-xs">{sale.model}</td>
                  <td className="border border-gray-300 py-2 px-2 text-center text-xs font-semibold">{sale.quantity}</td>
                  <td className="border border-gray-300 py-2 px-2 text-right text-xs font-bold">{formatCurrency(sale.total)}</td>
                  <td className="border border-gray-300 py-2 px-2 text-center text-xs">{sale.paymentMethod}</td>
                  <td className="border border-gray-300 py-2 px-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      sale.status === 'completed' ? 'bg-emerald-200 text-emerald-800' :
                      sale.status === 'pending' ? 'bg-orange-200 text-orange-800' :
                      sale.status === 'processing' ? 'bg-blue-200 text-blue-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {sale.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-800 text-white font-bold">
                <td colSpan="4" className="border border-gray-400 py-2 px-2 text-xs text-right">GRAND TOTAL:</td>
                <td className="border border-gray-400 py-2 px-2 text-center text-xs">{sales.reduce((sum, s) => sum + s.quantity, 0)}</td>
                <td className="border border-gray-400 py-2 px-2 text-right text-xs">{formatCurrency(totalRevenue)}</td>
                <td colSpan="2" className="border border-gray-400 py-2 px-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-800 pt-4 mt-8">
        <div className="text-center text-xs text-gray-600">
          <p className="font-bold mb-1">Unicorn EV Bikes - Sales Report</p>
          <p>For queries, contact: info@unicornevbikes.com | Phone: +92 300 1234567</p>
          <p className="mt-2 text-gray-500">Generated on {new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} | This is a computer-generated report</p>
        </div>
      </div>
    </div>
  );
});

SalesReport.displayName = 'SalesReport';

export default SalesReport;
