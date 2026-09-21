import React, { forwardRef, useState } from 'react';
import Logo from '../assets/Logo.png';
import { Button } from '@/components/ui/button';
import { Printer, ShieldCheck, FileText, KeyRound } from 'lucide-react';

export const GatePass = forwardRef(({ sale, customer, vehicle }, ref) => {
  const dateStr = new Date(sale?.createdAt || Date.now()).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(sale?.createdAt || Date.now()).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div ref={ref} className="bg-white text-black p-8 max-w-[800px] mx-auto border border-gray-300 font-sans print:border-none print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="Unicorn EV" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-black tracking-wider uppercase">Unicorn EV Motors</h1>
            <p className="text-xs text-gray-600 font-medium">Authorized Electric Vehicle Showroom & Distribution Center</p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-widest rounded">
            Official Gate Pass
          </span>
          <p className="text-xs text-gray-700 font-mono mt-2 font-bold">PASS #: GP-{sale?.invoiceId?.replace('INV-', '') || Date.now()}</p>
          <p className="text-xs text-gray-500">Date: {dateStr} {timeStr}</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-300 p-2.5 rounded text-xs text-amber-900 mb-5 flex items-center gap-2">
        <KeyRound className="w-4 h-4 shrink-0 text-amber-700" />
        <span><strong>SECURITY CLEARANCE:</strong> Security personnel are authorized to allow the exit of the below vehicle only after verifying customer CNIC and physically matching the chassis number.</span>
      </div>

      {/* Customer Particulars */}
      <div className="mb-5 border border-gray-200 rounded p-4 bg-gray-50/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2 border-b pb-1">Customer / Receiver Particulars</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div><span className="text-gray-500">Customer Name:</span> <strong className="text-gray-900">{customer?.name || sale?.customer}</strong></div>
          <div><span className="text-gray-500">CNIC / ID:</span> <strong className="text-gray-900 font-mono">{customer?.cnic || sale?.customerCnic || 'N/A'}</strong></div>
          <div><span className="text-gray-500">Contact Number:</span> <strong className="text-gray-900">{customer?.phone || sale?.customerPhone}</strong></div>
          <div><span className="text-gray-500">Invoice Reference:</span> <strong className="text-gray-900 font-mono">#{sale?.invoiceId}</strong></div>
          <div className="col-span-2"><span className="text-gray-500">Delivery Address:</span> <span className="text-gray-800">{customer?.address?.street || customer?.address || sale?.customerAddress || 'Showroom Handover'}</span></div>
        </div>
      </div>

      {/* Vehicle Particulars */}
      <div className="mb-5 border border-gray-200 rounded p-4 bg-gray-50/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2 border-b pb-1">Vehicle Specifications & Identification</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-gray-500">Make & Model:</span> <strong className="text-gray-900">{vehicle?.name || vehicle?.model || sale?.model}</strong></div>
          <div><span className="text-gray-500">Vehicle Color:</span> <strong className="text-gray-900">{vehicle?.color || sale?.color || 'Standard'}</strong></div>
          <div className="p-2 bg-white rounded border border-gray-300">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Chassis / VIN Number:</span>
            <strong className="text-sm font-mono tracking-wider text-black">{vehicle?.chassisNumber || sale?.chassisNumber || 'UNASSIGNED'}</strong>
          </div>
          <div className="p-2 bg-white rounded border border-gray-300">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Motor Number:</span>
            <strong className="text-sm font-mono tracking-wider text-black">{vehicle?.motorNumber || sale?.motorNumber || 'N/A'}</strong>
          </div>
          <div className="col-span-2 p-2 bg-white rounded border border-gray-300">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Battery Pack Serial Number:</span>
            <strong className="text-xs font-mono tracking-wider text-black">{vehicle?.batterySerial || sale?.batterySerial || 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* Handover Checklist */}
      <div className="mb-6 border border-gray-200 rounded p-3 text-xs">
        <h4 className="font-bold text-gray-800 mb-2">Showroom Exit Handover Checklist:</h4>
        <div className="grid grid-cols-2 gap-2 text-gray-700">
          <div className="flex items-center gap-2"><input type="checkbox" defaultChecked readOnly /> <span>Physical vehicle inspection satisfactory</span></div>
          <div className="flex items-center gap-2"><input type="checkbox" defaultChecked readOnly /> <span>Standard smart charger handed over</span></div>
          <div className="flex items-center gap-2"><input type="checkbox" defaultChecked readOnly /> <span>2 original vehicle keys delivered</span></div>
          <div className="flex items-center gap-2"><input type="checkbox" defaultChecked readOnly /> <span>Warranty card & owner manual given</span></div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
        <div className="border-t border-black pt-2">
          <p className="font-bold text-gray-900">Customer Receiver</p>
          <p className="text-[10px] text-gray-500">Sign & Thumb Impression</p>
        </div>
        <div className="border-t border-black pt-2">
          <p className="font-bold text-gray-900">Store / Showroom Manager</p>
          <p className="text-[10px] text-gray-500">Authorized Officer Seal</p>
        </div>
        <div className="border-t border-black pt-2">
          <p className="font-bold text-gray-900">Security Gate Officer</p>
          <p className="text-[10px] text-gray-500">Exit Verification Stamp</p>
        </div>
      </div>
    </div>
  );
});

GatePass.displayName = 'GatePass';

export const RegistrationLetter = forwardRef(({ sale, customer, vehicle }, ref) => {
  const dateStr = new Date(sale?.createdAt || Date.now()).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div ref={ref} className="bg-white text-black p-10 max-w-[800px] mx-auto border border-gray-300 font-serif leading-relaxed print:border-none print:p-4">
      {/* Letterhead */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <img src={Logo} alt="Unicorn EV" className="w-16 h-16 object-contain mx-auto mb-2" />
        <h1 className="text-2xl font-bold tracking-wide uppercase font-sans">UNICORN EV MOTORS PRIVATE LIMITED</h1>
        <p className="text-xs text-gray-600 font-sans">Corporate Office: Showroom #4, Auto Complex, Main Boulevard, Lahore / Karachi, Pakistan</p>
        <p className="text-xs text-gray-500 font-sans">NTN: 8945621-3 | Phone: +92 300 1234567 | Email: info@unicornev.pk</p>
      </div>

      <div className="flex justify-between text-xs font-sans mb-6">
        <div><strong>Ref:</strong> UEV/EXCISE/{sale?.invoiceId?.replace('INV-', '') || '2026/01'}</div>
        <div><strong>Date:</strong> {dateStr}</div>
      </div>

      {/* Recipient */}
      <div className="text-sm font-sans mb-6">
        <p className="font-bold">To,</p>
        <p className="font-bold">The Motor Registration Authority,</p>
        <p>Excise, Taxation & Narcotics Control Department,</p>
        <p>Government of Pakistan.</p>
      </div>

      <div className="text-center my-4">
        <h2 className="text-base font-bold underline uppercase font-sans">Subject: Sale Certificate & Authority Letter for EV Registration</h2>
      </div>

      <div className="text-xs space-y-3 font-sans text-justify text-gray-800">
        <p>Dear Sir / Madam,</p>
        <p>
          This is to certify that we, <strong>Unicorn EV Motors (Pvt) Ltd</strong>, have sold, transferred, and handed over the ownership of the following brand new zero-emission Electric Vehicle to the purchaser detailed below:
        </p>
      </div>

      {/* Vehicle Details Table */}
      <table className="w-full border-collapse border border-black my-5 text-xs font-sans">
        <tbody>
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-gray-100 font-bold w-1/3">Owner / Purchaser Name:</td>
            <td className="p-2 font-bold uppercase">{customer?.name || sale?.customer}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-gray-100 font-bold">Purchaser CNIC Number:</td>
            <td className="p-2 font-mono font-bold">{customer?.cnic || sale?.customerCnic || 'N/A'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-gray-100 font-bold">Residential Address:</td>
            <td className="p-2">{customer?.address?.street || customer?.address || sale?.customerAddress || 'As per CNIC'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-gray-100 font-bold">Vehicle Make / Category:</td>
            <td className="p-2 font-bold">Unicorn EV (Electric Two-Wheeler)</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-gray-100 font-bold">Model Name / Variant:</td>
            <td className="p-2">{vehicle?.name || vehicle?.model || sale?.model}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-gray-100 font-bold">Chassis / Frame Number:</td>
            <td className="p-2 font-mono font-bold text-sm tracking-wider">{vehicle?.chassisNumber || sale?.chassisNumber || 'N/A'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-gray-100 font-bold">Electric Motor Number:</td>
            <td className="p-2 font-mono font-bold text-sm tracking-wider">{vehicle?.motorNumber || sale?.motorNumber || 'N/A'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-gray-100 font-bold">Color:</td>
            <td className="p-2">{vehicle?.color || sale?.color || 'Factory Finish'}</td>
          </tr>
          <tr>
            <td className="p-2 border-r border-black bg-gray-100 font-bold">Sale Invoice & Date:</td>
            <td className="p-2 font-mono">Invoice #{sale?.invoiceId} dated {dateStr}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-xs font-sans text-gray-800 text-justify mb-10">
        <p>
          We confirm that all government customs, manufacturing standards, and applicable sales taxes have been duly settled. You are requested to kindly register the said electric motorcycle in the name of the above-named purchaser and issue the official Registration Smart Card accordingly.
        </p>
      </div>

      {/* Signature & Seal */}
      <div className="flex justify-between items-end pt-8 font-sans text-xs">
        <div>
          <div className="w-40 border-b border-black mb-1"></div>
          <p className="font-bold">Purchaser Signature</p>
        </div>
        <div className="text-center">
          <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400 mb-1 mx-auto">
            [ Company Seal ]
          </div>
          <p className="font-bold">For Unicorn EV Motors (Pvt) Ltd</p>
          <p className="text-[10px] text-gray-500">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
});

RegistrationLetter.displayName = 'RegistrationLetter';

export const WarrantyCertificate = forwardRef(({ sale, customer, vehicle }, ref) => {
  const dateStr = new Date(sale?.createdAt || Date.now()).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div ref={ref} className="bg-white text-black p-8 max-w-[800px] mx-auto border-2 border-blue-900 rounded-lg font-sans print:border-none print:p-4">
      {/* Decorative Border Header */}
      <div className="border-b-2 border-blue-900 pb-4 mb-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src={Logo} alt="Unicorn EV" className="w-14 h-14 object-contain" />
          <div>
            <h1 className="text-2xl font-black tracking-wider text-blue-950 uppercase">Unicorn EV Motors</h1>
            <p className="text-xs text-blue-800 font-semibold tracking-widest uppercase">Official Warranty Certificate & Quality Guarantee</p>
          </div>
        </div>
      </div>

      {/* Vehicle & Customer Info Card */}
      <div className="grid grid-cols-2 gap-4 bg-blue-50/60 border border-blue-200 rounded p-4 text-xs mb-5">
        <div>
          <p><span className="text-gray-500">Customer Name:</span> <strong>{customer?.name || sale?.customer}</strong></p>
          <p className="mt-1"><span className="text-gray-500">CNIC:</span> <strong className="font-mono">{customer?.cnic || sale?.customerCnic || 'N/A'}</strong></p>
          <p className="mt-1"><span className="text-gray-500">Delivery Date:</span> <strong>{dateStr}</strong></p>
        </div>
        <div>
          <p><span className="text-gray-500">Model:</span> <strong>{vehicle?.name || vehicle?.model || sale?.model}</strong></p>
          <p className="mt-1"><span className="text-gray-500">Chassis No:</span> <strong className="font-mono text-black">{vehicle?.chassisNumber || sale?.chassisNumber || 'N/A'}</strong></p>
          <p className="mt-1"><span className="text-gray-500">Motor No:</span> <strong className="font-mono text-black">{vehicle?.motorNumber || sale?.motorNumber || 'N/A'}</strong></p>
        </div>
      </div>

      {/* Coverage Table */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2 flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-blue-600" /> Authorized Warranty Coverage Terms
      </h3>
      <table className="w-full border-collapse border border-gray-300 text-xs mb-5">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="p-2 text-left font-bold">Component</th>
            <th className="p-2 text-left font-bold">Duration</th>
            <th className="p-2 text-left font-bold">Mileage Limit</th>
            <th className="p-2 text-left font-bold">Coverage Scope</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-800">
          <tr>
            <td className="p-2 font-bold">EV Traction Motor</td>
            <td className="p-2">24 Months</td>
            <td className="p-2">20,000 KM</td>
            <td className="p-2">Internal electrical defect, coil burning & manufacturing flaws</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="p-2 font-bold">Lithium / Graphene Battery Pack</td>
            <td className="p-2">18 Months</td>
            <td className="p-2">15,000 KM</td>
            <td className="p-2">Capacity degradation below 70%, BMS fault, cell replacement</td>
          </tr>
          <tr>
            <td className="p-2 font-bold">Sine-Wave Motor Controller</td>
            <td className="p-2">12 Months</td>
            <td className="p-2">12,000 KM</td>
            <td className="p-2">Electronic component failure under normal operating parameters</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="p-2 font-bold">Vehicle Chassis / Frame</td>
            <td className="p-2">36 Months</td>
            <td className="p-2">Unlimited</td>
            <td className="p-2">Structural welding defect, tensile frame failure (non-collision)</td>
          </tr>
          <tr>
            <td className="p-2 font-bold">Smart Charger & Converter</td>
            <td className="p-2">06 Months</td>
            <td className="p-2">N/A</td>
            <td className="p-2">Power unit breakdown not caused by severe line voltage surge</td>
          </tr>
        </tbody>
      </table>

      {/* Free Inspection Log */}
      <h4 className="text-xs font-bold uppercase text-gray-800 mb-2">Free Periodic Service Vouchers:</h4>
      <div className="grid grid-cols-3 gap-3 text-xs mb-5">
        <div className="border border-dashed border-gray-400 p-2 rounded text-center">
          <p className="font-bold text-blue-900">1st Inspection</p>
          <p className="text-[10px] text-gray-600">500 KM or 30 Days</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">[ FREE LABOUR ]</p>
        </div>
        <div className="border border-dashed border-gray-400 p-2 rounded text-center">
          <p className="font-bold text-blue-900">2nd Inspection</p>
          <p className="text-[10px] text-gray-600">1500 KM or 90 Days</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">[ FREE LABOUR ]</p>
        </div>
        <div className="border border-dashed border-gray-400 p-2 rounded text-center">
          <p className="font-bold text-blue-900">3rd Inspection</p>
          <p className="text-[10px] text-gray-600">3000 KM or 180 Days</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">[ FREE LABOUR ]</p>
        </div>
      </div>

      {/* Important Disclaimer */}
      <div className="text-[10px] text-gray-500 mb-6 border-t pt-2">
        <p><strong>Conditions:</strong> Warranty is void if the vehicle is altered with unauthorized aftermarket electrical equipment, submerged in water beyond wheel axle, or repaired outside authorized Unicorn EV service centers.</p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-10 pt-4 text-xs">
        <div className="text-center border-t border-black pt-1">
          <p className="font-bold">Customer Signature</p>
        </div>
        <div className="text-center border-t border-black pt-1">
          <p className="font-bold">Authorized Warranty Officer</p>
          <p className="text-[10px] text-gray-500">Unicorn EV Quality Assurance</p>
        </div>
      </div>
    </div>
  );
});

WarrantyCertificate.displayName = 'WarrantyCertificate';

export default function HandoverModal({ isOpen, onClose, sale, customer, vehicle }) {
  const [activeTab, setActiveTab] = useState('gatepass');
  const printRef = React.useRef();

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeTab.toUpperCase()} - ${sale?.invoiceId || 'UNICORN-EV'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: white; color: black; padding: 15px; }
            table { border-collapse: collapse; width: 100%; }
            @media print {
              body { padding: 0; }
              @page { size: auto; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          ${content.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-500" />
            <h2 className="text-lg font-bold text-foreground">Official Vehicle Handover Documents</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
              <Printer className="w-4 h-4 mr-1.5" /> Print Document
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-muted/40 p-2 gap-2">
          <button
            onClick={() => setActiveTab('gatepass')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'gatepass'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            Showroom Gate Pass
          </button>
          <button
            onClick={() => setActiveTab('registration')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'registration'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            Excise Authority / Registration Letter
          </button>
          <button
            onClick={() => setActiveTab('warranty')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'warranty'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            EV Warranty Certificate
          </button>
        </div>

        {/* Preview Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-neutral-900/10 dark:bg-black/40">
          {activeTab === 'gatepass' && <GatePass ref={printRef} sale={sale} customer={customer} vehicle={vehicle} />}
          {activeTab === 'registration' && <RegistrationLetter ref={printRef} sale={sale} customer={customer} vehicle={vehicle} />}
          {activeTab === 'warranty' && <WarrantyCertificate ref={printRef} sale={sale} customer={customer} vehicle={vehicle} />}
        </div>
      </div>
    </div>
  );
}
