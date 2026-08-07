import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import ReactBarcode from 'react-barcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  renderType?: 'barcode' | 'qrcode' | 'both';
}

export default function Barcode({ 
  value, 
  width = 1.2, 
  height = 45, 
  showText = true,
  renderType = 'both'
}: BarcodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Generate QR code base64 url
  useEffect(() => {
    if (renderType === 'qrcode' || renderType === 'both') {
      QRCode.toDataURL(value, {
        margin: 1,
        width: 160,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
    }
  }, [value, renderType]);

  const cleanValue = value.toUpperCase().replace(/[^0-9A-Z\-.\s]/g, '');

  return (
    <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs hover:shadow-2xs transition-all w-full" dir="ltr">
      
      {/* Container for code rendering based on renderType */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
        
        {/* BARCODE RENDER */}
        {(renderType === 'barcode' || renderType === 'both') && (
          <div className="flex flex-col items-center justify-center grow max-w-full">
            <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden w-full">
               <ReactBarcode 
                  value={cleanValue} 
                  width={width} 
                  height={height} 
                  displayValue={false} 
                  background="#ffffff" 
                  lineColor="#000000" 
                  margin={0}
                  format="CODE128"
               />
            </div>
            {showText && renderType === 'barcode' && (
              <span className="mt-1.5 text-[10px] font-mono tracking-[4px] font-bold text-slate-800 uppercase text-center">
                {cleanValue}
              </span>
            )}
          </div>
        )}

        {/* QR CODE RENDER */}
        {(renderType === 'qrcode' || renderType === 'both') && qrDataUrl && (
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-4xs flex items-center justify-center hover:scale-105 transition-transform duration-200">
              <img 
                src={qrDataUrl} 
                alt={`QR code for ${value}`} 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain block" 
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Unified Caption display */}
      {showText && renderType !== 'barcode' && (
        <div className="mt-2 text-center">
          <span className="text-[10px] font-mono tracking-[3px] font-black text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-sm uppercase">
            ID: {cleanValue}
          </span>
        </div>
      )}
    </div>
  );
}
