import React, { forwardRef } from 'react';
import Logo from '../assets/Logo.png';
import { Button } from '@/components/ui/button';
import { Printer, Scale, ShieldCheck } from 'lucide-react';

export const InstallmentAgreementDocument = forwardRef(({ plan }, ref) => {
  const dateStr = new Date(plan?.startDate || Date.now()).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formatPKR = (amt) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const guarantor1 = plan?.guarantors?.[0] || {};
  const guarantor2 = plan?.guarantors?.[1] || {};

  return (
    <div
      ref={ref}
      className="bg-white text-black p-10 max-w-[850px] mx-auto border border-gray-400 font-serif leading-relaxed text-xs print:border-none print:p-2"
    >
      {/* Top Space for E-Stamp / Non-Judicial Stamp Paper */}
      <div className="border-2 border-dashed border-gray-400 rounded p-4 text-center mb-6 text-gray-500 bg-gray-50">
        <Scale className="w-6 h-6 mx-auto mb-1 text-gray-600" />
        <p className="font-bold text-xs uppercase tracking-widest text-gray-700">Space for Govt. of Punjab / Sindh E-Stamp Paper</p>
        <p className="text-[10px]">Affix Rs. 100/- or prescribed value non-judicial stamp paper here if legally notarizing</p>
      </div>

      {/* Contract Title */}
      <div className="text-center border-b-2 border-black pb-3 mb-5">
        <h1 className="text-xl font-black uppercase tracking-wider font-sans">
          VEHICLE INSTALLMENT SALE & GUARANTEE AGREEMENT
        </h1>
        <h2 className="text-base font-bold text-gray-800 font-sans mt-1">
          (اقرار نامہ اقساط بمعہ ضامنان)
        </h2>
        <p className="text-[11px] text-gray-600 font-sans mt-1">
          Contract Ref #: <strong>{plan?.installmentPlanId}</strong> | Date: <strong>{dateStr}</strong>
        </p>
      </div>

      {/* Contract Parties */}
      <div className="space-y-3 mb-5 text-justify font-sans">
        <p>
          This Agreement is entered into on <strong>{dateStr}</strong> between:
        </p>
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <p>
            <strong>1. THE SELLER (First Party):</strong> <strong>Unicorn EV Motors (Pvt) Ltd</strong>, having its principal showroom and business office in Pakistan (hereinafter referred to as the &quot;Company/Seller&quot;).
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <p>
            <strong>2. THE PURCHASER (Second Party):</strong> Mr./Ms. <strong>{plan?.customer}</strong>, holder of CNIC No. <strong className="font-mono">{plan?.customerCNIC}</strong>, Phone: <strong>{plan?.customerPhone}</strong>, Resident of: <strong>{plan?.customerAddress || 'Address as per CNIC'}</strong> (hereinafter referred to as the &quot;Buyer/Hirer&quot;).
          </p>
        </div>
      </div>

      {/* Vehicle & Financial Particulars */}
      <div className="mb-5 font-sans">
        <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
          Clause 1: Vehicle & Financial Breakdown
        </h3>
        <table className="w-full border-collapse border border-black text-[11px]">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black bg-gray-100 font-bold w-1/4">Vehicle Model:</td>
              <td className="p-2 font-bold">{plan?.productName}</td>
              <td className="p-2 border-r border-black border-l bg-gray-100 font-bold w-1/4">Sale Invoice ID:</td>
              <td className="p-2 font-mono">#{plan?.invoiceId}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black bg-gray-100 font-bold">Total Vehicle Price:</td>
              <td className="p-2 font-bold text-black">{formatPKR(plan?.totalAmount)}</td>
              <td className="p-2 border-r border-black border-l bg-gray-100 font-bold">Down Payment Paid:</td>
              <td className="p-2 font-bold text-black">{formatPKR(plan?.downPayment)}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black bg-gray-100 font-bold">Remaining Balance:</td>
              <td className="p-2 font-bold text-black">{formatPKR(plan?.remainingAmount)}</td>
              <td className="p-2 border-r border-black border-l bg-gray-100 font-bold">No. of Installments:</td>
              <td className="p-2 font-bold">{plan?.numberOfInstallments} ({plan?.frequency})</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-black bg-gray-100 font-bold">Regular Installment:</td>
              <td className="p-2 font-bold text-black">{formatPKR(plan?.installmentAmount)} / period</td>
              <td className="p-2 border-r border-black border-l bg-gray-100 font-bold">Final Installment:</td>
              <td className="p-2 font-bold text-black">{formatPKR(plan?.lastInstallmentAmount || plan?.installmentAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legal Guarantors (Zamin 1 & Zamin 2) */}
      <div className="mb-5 font-sans">
        <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
          Clause 2: Joint & Several Personal Guarantees (ضامنان)
        </h3>
        <p className="text-[10px] text-gray-700 mb-2">
          We, the undersigned Guarantors, hereby stand as continuous sureties and unconditionally guarantee to the Seller that in the event the Buyer defaults in making payment of any installment on the due date, we shall jointly and severally be liable to pay the entire outstanding balance immediately upon demand.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="border border-black p-2.5 rounded bg-gray-50/70 text-[11px] space-y-1">
            <p className="font-bold text-black border-b pb-0.5 uppercase">Guarantor 1 (ضامن اول)</p>
            <p><span className="text-gray-600">Name:</span> <strong>{guarantor1.name || '________________________'}</strong></p>
            <p><span className="text-gray-600">CNIC:</span> <strong className="font-mono">{guarantor1.cnic || '__________________'}</strong></p>
            <p><span className="text-gray-600">Phone:</span> <strong>{guarantor1.phone || '__________________'}</strong></p>
            <p><span className="text-gray-600">Relation:</span> <strong>{guarantor1.relation || '________________'}</strong></p>
            <p><span className="text-gray-600">Workplace:</span> <strong>{guarantor1.workplace || '________________'}</strong></p>
            <p><span className="text-gray-600">Address:</span> <span>{guarantor1.address || '____________________________________'}</span></p>
          </div>

          <div className="border border-black p-2.5 rounded bg-gray-50/70 text-[11px] space-y-1">
            <p className="font-bold text-black border-b pb-0.5 uppercase">Guarantor 2 (ضامن دوم)</p>
            <p><span className="text-gray-600">Name:</span> <strong>{guarantor2.name || '________________________'}</strong></p>
            <p><span className="text-gray-600">CNIC:</span> <strong className="font-mono">{guarantor2.cnic || '__________________'}</strong></p>
            <p><span className="text-gray-600">Phone:</span> <strong>{guarantor2.phone || '__________________'}</strong></p>
            <p><span className="text-gray-600">Relation:</span> <strong>{guarantor2.relation || '________________'}</strong></p>
            <p><span className="text-gray-600">Workplace:</span> <strong>{guarantor2.workplace || '________________'}</strong></p>
            <p><span className="text-gray-600">Address:</span> <span>{guarantor2.address || '____________________________________'}</span></p>
          </div>
        </div>
      </div>

      {/* Terms and Default Clauses */}
      <div className="mb-6 font-sans text-[10.5px] space-y-2 text-justify text-gray-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1">
          Clause 3: Terms & Repossession Condition
        </h3>
        <p>
          1. <strong>Ownership Reservation:</strong> The vehicle remains the absolute legal property of Unicorn EV Motors until the final installment is paid and an official No Objection Certificate (NOC) is issued.
        </p>
        <p>
          2. <strong>Default & Repossession:</strong> In the event of default of any installment exceeding the {plan?.gracePeriodDays || 3}-day grace period, the Seller possesses full lawful right to repossess the vehicle from anywhere without notice.
        </p>
        <p>
          3. <strong>Prohibition of Sale:</strong> The Buyer shall not sell, pledge, rent, mortgage, or transfer possession of the vehicle to any third party until complete liquidation of all debts.
        </p>
      </div>

      {/* Formal Signatures & Thumb Impressions */}
      <div className="grid grid-cols-4 gap-4 pt-10 text-center font-sans text-[10px]">
        <div className="border-t-2 border-black pt-2">
          <p className="font-bold text-black text-xs">Buyer / Purchaser</p>
          <p className="text-gray-600">Sign & Thumb Impression</p>
        </div>
        <div className="border-t-2 border-black pt-2">
          <p className="font-bold text-black text-xs">Guarantor 1 (Zamin 1)</p>
          <p className="text-gray-600">Sign & Thumb Impression</p>
        </div>
        <div className="border-t-2 border-black pt-2">
          <p className="font-bold text-black text-xs">Guarantor 2 (Zamin 2)</p>
          <p className="text-gray-600">Sign & Thumb Impression</p>
        </div>
        <div className="border-t-2 border-black pt-2">
          <p className="font-bold text-black text-xs">For Unicorn EV Motors</p>
          <p className="text-gray-600">Manager Seal & Signature</p>
        </div>
      </div>
    </div>
  );
});

InstallmentAgreementDocument.displayName = 'InstallmentAgreementDocument';

export default function InstallmentAgreementModal({ isOpen, onClose, plan }) {
  const printRef = React.useRef();

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Legal Installment Agreement - ${plan?.installmentPlanId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", serif; background: white; color: black; padding: 15px; }
            table { border-collapse: collapse; width: 100%; }
            @media print {
              body { padding: 0; }
              @page { size: A4 portrait; margin: 12mm; }
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
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-500" />
            <h2 className="text-lg font-bold text-foreground">Legal Installment Agreement (Halafnama / Stamp Format)</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
              <Printer className="w-4 h-4 mr-1.5" /> Print Legal Agreement
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-neutral-900/10 dark:bg-black/40">
          <InstallmentAgreementDocument ref={printRef} plan={plan} />
        </div>
      </div>
    </div>
  );
}
