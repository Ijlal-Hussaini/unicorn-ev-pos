import { forwardRef } from 'react';
import Logo from '../assets/Logo.png';

const Receipt = forwardRef(({ saleData, customerData, productData, cartItems }, ref) => {
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle both single product and cart items
  const items = cartItems || (productData ? [{
    product: productData,
    quantity: saleData?.quantity || 1
  }] : []);

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.17; // 17% GST
  const grandTotal = subtotal + tax;

  return (
    <div ref={ref} className="bg-white text-black p-6 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-3 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Unicorn EV Bikes" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Unicorn EV Bikes</h1>
              <p className="text-xs text-gray-600 mt-1">Electric Mobility Solutions</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">SALES RECEIPT</h2>
            <p className="text-xs text-gray-600 mt-1">Invoice #{saleData?.invoiceId || 'MULTI'}</p>
          </div>
        </div>
      </div>

      {/* Company & Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-5">
        {/* Company Info */}
        <div>
          <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase">From:</h3>
          <div className="text-xs text-gray-700 space-y-0.5">
            <p className="font-semibold">Unicorn EV Bikes</p>
            <p>123 Main Street, Karachi</p>
            <p>Sindh 75500, Pakistan</p>
            <p>Phone: +92 300 1234567</p>
          </div>
        </div>

        {/* Customer Info */}
        <div>
          <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase">Bill To:</h3>
          <div className="text-xs text-gray-700 space-y-0.5">
            <p className="font-semibold">{customerData.name}</p>
            {customerData.address?.street && <p>{customerData.address.street}</p>}
            {(customerData.address?.city || customerData.address?.state) && (
              <p>
                {customerData.address.city}
                {customerData.address.city && customerData.address.state && ', '}
                {customerData.address.state}
              </p>
            )}
            <p>Phone: {customerData.phone}</p>
            {customerData.email && <p>Email: {customerData.email}</p>}
          </div>
        </div>
      </div>

      {/* Sale Details - Single Row */}
      <div className="mb-5 p-3 bg-gray-50 rounded border border-gray-200">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-gray-600">Date: </span>
            <span className="font-semibold text-gray-900">{formatDate(new Date())}</span>
          </div>
          <div>
            <span className="text-gray-600">Payment: </span>
            <span className="font-semibold text-gray-900">{saleData?.paymentMethod || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Status: </span>
            <span className="font-semibold text-gray-900 capitalize">{saleData?.status || 'completed'}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left py-2 px-3 font-semibold text-xs">Item Description</th>
              <th className="text-center py-2 px-3 font-semibold text-xs">SKU</th>
              <th className="text-center py-2 px-3 font-semibold text-xs">Qty</th>
              <th className="text-right py-2 px-3 font-semibold text-xs">Unit Price</th>
              <th className="text-right py-2 px-3 font-semibold text-xs">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const itemTotal = item.product.price * item.quantity;
              return (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-2 px-3">
                    <p className="font-semibold text-gray-900 text-sm">{item.product.name}</p>
                    <p className="text-xs text-gray-600">{item.product.model}</p>
                  </td>
                  <td className="text-center py-2 px-3 text-xs text-gray-700">{item.product.sku}</td>
                  <td className="text-center py-2 px-3 text-gray-900 font-semibold text-xs">{item.quantity}</td>
                  <td className="text-right py-2 px-3 text-gray-900 text-xs">{formatCurrency(item.product.price)}</td>
                  <td className="text-right py-2 px-3 text-gray-900 font-semibold text-xs">{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals - Right Aligned */}
      <div className="flex justify-end mb-5">
        <div className="w-80">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="text-left py-2 px-3 text-sm text-gray-900 font-semibold">Subtotal:</td>
                <td className="text-right py-2 px-3 text-sm text-gray-900 font-semibold">{formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td className="text-left py-2 px-3 text-sm text-gray-900 font-semibold">GST (17%):</td>
                <td className="text-right py-2 px-3 text-sm text-gray-900 font-semibold">{formatCurrency(tax)}</td>
              </tr>
              <tr className="border-t-2 border-gray-800">
                <td className="text-left py-2 px-3 text-base font-bold">Grand Total:</td>
                <td className="text-right py-2 px-3 text-lg font-bold">{formatCurrency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {saleData?.notes && (
        <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200">
          <h3 className="text-xs font-bold text-gray-900 mb-1">Notes:</h3>
          <p className="text-xs text-gray-700">{saleData.notes}</p>
        </div>
      )}

      {/* Warranty & Terms - Compact */}
      <div className="border-t border-gray-300 pt-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <h4 className="font-bold text-gray-900 mb-1 text-xs">Warranty:</h4>
            <ul className="space-y-0.5 list-disc list-inside text-xs">
              <li>Motor & Battery: As per manufacturer</li>
              <li>Frame: 1 year</li>
              <li>Accessories: 6 months</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1 text-xs">Terms:</h4>
            <ul className="space-y-0.5 list-disc list-inside text-xs">
              <li>All sales final unless defective</li>
              <li>Returns within 7 days with receipt</li>
              <li>Free service for 3 months</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mb-4">
        <div className="border-t border-gray-400 pt-1">
          <p className="text-xs text-gray-600 text-center">Customer Signature</p>
        </div>
        <div className="border-t border-gray-400 pt-1">
          <p className="text-xs text-gray-600 text-center">Authorized Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
        <p className="font-semibold">Thank you for choosing Unicorn EV Bikes!</p>
        <p className="mt-1">For support: +92 300 1234567 | www.unicornevbikes.com</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;
