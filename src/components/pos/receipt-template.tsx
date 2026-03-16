// File: src/components/pos/receipt-template.tsx
import React from 'react';

// Define the transaction structure based on schema
// 'items' would be derived from the transaction_items table joining entities
export interface TransactionItem {
  quantity: number;
  item_name: string;
  price_at_time: number;
}

export interface TransactionProps {
  business_name: string;
  created_at: string;
  items: TransactionItem[];
  total: number;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, { transaction: TransactionProps }>(
  ({ transaction }, ref) => {
    return (
      <div className="hidden print:block print:w-[80mm] print:m-0 print:p-0 text-black bg-card" ref={ref}>
        <style type="text/css" media="print">
          {`
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 2mm; -webkit-print-color-adjust: exact; font-family: monospace; }
            * { box-sizing: border-box; }
            @media print {
              body * {
                visibility: hidden;
              }
              .receipt-container, .receipt-container * {
                visibility: visible;
              }
              .receipt-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
          `}
        </style>
        
        {/* Receipt Content */}
        <div className="receipt-container">
          <div className="text-center font-bold text-lg mb-2">{transaction.business_name}</div>
          <div className="text-sm mb-4 border-b border-black pb-2 text-center">
            {new Date(transaction.created_at).toLocaleString()}
          </div>

          <table className="w-full text-sm mb-4">
            <tbody>
              {transaction.items.map((item, i) => (
                <tr key={i}>
                  <td className="text-left py-1 align-top">{item.quantity}x {item.item_name}</td>
                  <td className="text-right py-1 align-top">${item.price_at_time.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-black pt-2 text-right font-bold text-lg">
            TOTAL: ${transaction.total.toFixed(2)}
          </div>
          
          {/* QR Code Placeholder for SAT/CoDi (Mexican Digital Invoicing/Payments) */}
          <div className="mt-4 flex justify-center">
            <div className="w-24 h-24 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-center p-2">
              SAT QR Placeholder
            </div>
          </div>

          <div className="mt-4 text-center text-xs pb-8">
            *** GRACIAS POR SU COMPRA ***
          </div>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
