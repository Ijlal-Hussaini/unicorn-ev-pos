import { forwardRef } from 'react';
import Logo from '../assets/Logo.png';

const Receipt = forwardRef(({ saleData, customerData, productData, cartItems, format = 'standard' }, ref) => {
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle both single product and cart items
  const items = cartItems || (productData ? [{
    product: productData,
    quantity: saleData?.quantity || 1,
    chassisNumber: saleData?.chassisNumber,
    motorNumber: saleData?.motorNumber,
    batterySerial: saleData?.batterySerial,
    color: saleData?.color,
  }] : []);

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1), 0);
  const tax = subtotal * 0.17; // 17% GST
  const grandTotal = subtotal + tax;

  // 80mm Thermal Receipt Layout
  if (format === 'thermal') {
    return (
      <div
        ref={ref}
        className="bg-white text-black p-4 w-[320px] mx-auto font-mono text-[11px] leading-tight border border-gray-300 print:border-none print:w-full print:p-0"
      >
        <div className="text-center pb-2 border-b border-dashed border-black">
          <img src={Logo} alt="Unicorn EV" className="w-12 h-12 object-contain mx-auto mb-1 filter grayscale" />
          <h1 className="text-sm font-bold uppercase tracking-wider">Unicorn EV Bikes</h1>
          <p className="text-[10px]">Electric Mobility Solutions</p>
          <p className="text-[10px]">Phone: +92 300 1234567</p>
          <p className="text-[10px]">Karachi / Lahore, Pakistan</p>
        </div>

        <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>INV: #{saleData?.invoiceId || 'N/A'}</span>
            <span>{saleData?.paymentMethod || 'Cash'}</span>
          </div>
          <div className="flex justify-between">
            <span>Date: {formatDate(new Date())}</span>
          </div>
          <div>Cust: {customerData?.name || saleData?.customer || 'Walk-in'}</div>
          {customerData?.cnic && <div>CNIC: {customerData.cnic}</div>}
          {customerData?.phone && <div>Phone: {customerData.phone}</div>}
        </div>

        {/* Item List */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex justify-between font-bold pb-1 text-[10px] uppercase border-b border-gray-400">
            <span>Item</span>
            <span>Qty x Rate</span>
            <span>Total</span>
          </div>
          <div className="pt-1 space-y-1.5">
            {items.map((item, index) => {
              const itemTotal = (item.product?.price || 0) * (item.quantity || 1);
              const chassis = item.selectedUnit?.chassisNumber || item.chassisNumber;
              const motor = item.selectedUnit?.motorNumber || item.motorNumber;

              return (
                <div key={index}>
                  <div className="font-semibold">{item.product?.name || item.product?.model}</div>
                  <div className="flex justify-between text-gray-700">
                    <span>{item.quantity} x {formatCurrency(item.product?.price || 0)}</span>
                    <span className="font-bold text-black">{formatCurrency(itemTotal)}</span>
                  </div>
                  {chassis && (
                    <div className="text-[9px] text-gray-800 font-bold">
                      VIN: {chassis} {motor ? `| MOT: ${motor}` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-right">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (17%):</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
            <span>TOTAL:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 text-center text-[10px] space-y-1">
          <p className="font-bold">*** THANK YOU FOR GOING GREEN ***</p>
          <p className="text-[9px]">Keep receipt for warranty service</p>
          <p className="text-[8px] text-gray-500 pt-1">--------------------------------</p>
        </div>
      </div>
    );
  }

  // Standard A4/A5 Invoice Layout
  return (
    <div ref={ref} className="bg-white text-black p-6 max-w-[800px] mx-auto border border-gray-200 print:border-none print:p-2">
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
        <div>
          <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase">From:</h3>
          <div className="text-xs text-gray-700 space-y-0.5">
            <p className="font-semibold">Unicorn EV Bikes</p>
            <p>Main Commercial Boulevard, Auto Center</p>
            <p>Karachi / Lahore, Pakistan</p>
            <p>Phone: +92 300 1234567</p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase">Bill To:</h3>
          <div className="text-xs text-gray-700 space-y-0.5">
            <p className="font-semibold">{customerData?.name || saleData?.customer}</p>
            {(customerData?.cnic || saleData?.customerCnic) && (
              <p className="font-mono">CNIC: {customerData?.cnic || saleData?.customerCnic}</p>
            )}
            {customerData?.address?.street && <p>{customerData.address.street}</p>}
            {(customerData?.address?.city || customerData?.address?.state) && (
              <p>
                {customerData.address.city}
                {customerData.address.city && customerData.address.state && ', '}
                {customerData.address.state}
              </p>
            )}
            <p>Phone: {customerData?.phone || saleData?.customerPhone}</p>
            {customerData?.email && <p>Email: {customerData.email}</p>}
          </div>
        </div>
      </div>

      {/* Sale Details */}
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
              const itemTotal = (item.product?.price || 0) * (item.quantity || 1);
              const chassis = item.selectedUnit?.chassisNumber || item.chassisNumber;
              const motor = item.selectedUnit?.motorNumber || item.motorNumber;
              const battery = item.selectedUnit?.batterySerial || item.batterySerial;

              return (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-2 px-3">
                    <p className="font-semibold text-gray-900 text-sm">{item.product?.name || item.product?.model}</p>
                    <p className="text-xs text-gray-600">{item.product?.model}</p>
                    {chassis && (
                      <div className="mt-1 text-[11px] bg-blue-50 text-blue-900 border border-blue-200 rounded px-1.5 py-0.5 inline-block font-mono">
                        VIN: {chassis} {motor ? `| Motor: ${motor}` : ''} {battery ? `| Bat: ${battery}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="text-center py-2 px-3 text-xs text-gray-700">{item.product?.sku}</td>
                  <td className="text-center py-2 px-3 text-gray-900 font-semibold text-xs">{item.quantity}</td>
                  <td className="text-right py-2 px-3 text-gray-900 text-xs">{formatCurrency(item.product?.price || 0)}</td>
                  <td className="text-right py-2 px-3 text-gray-900 font-semibold text-xs">{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
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

      {/* Warranty & Terms */}
      <div className="border-t border-gray-300 pt-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <h4 className="font-bold text-gray-900 mb-1 text-xs">Warranty:</h4>
            <ul className="space-y-0.5 list-disc list-inside text-xs">
              <li>Traction Motor & Battery Pack: As per warranty handbook</li>
              <li>Chassis Frame: 3 years structural coverage</li>
              <li>Electronic Controller: 1 year warranty</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-1 text-xs">Terms & Handover:</h4>
            <ul className="space-y-0.5 list-disc list-inside text-xs">
              <li>Showroom Gate Pass issued upon physical inspection</li>
              <li>Excise Registration letter provided for MRA submission</li>
              <li>Periodic maintenance schedule at 500, 1500 & 3000 KM</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mb-4 pt-4">
        <div className="border-t border-gray-400 pt-1 text-center">
          <p className="text-xs text-gray-600">Customer Signature</p>
        </div>
        <div className="border-t border-gray-400 pt-1 text-center">
          <p className="text-xs text-gray-600">Authorized Showroom Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
        <p className="font-semibold">Thank you for choosing Unicorn EV Bikes!</p>
        <p className="mt-1">Helpline: +92 300 1234567 | Email: support@unicornev.pk</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;

