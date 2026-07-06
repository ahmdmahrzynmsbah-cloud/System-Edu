/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

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

  // Code 39 pattern map: W = Wide, N = Narrow
  const CODE39_PATTERNS: Record<string, string> = {
    '0': 'N N N W W N W N N',
    '1': 'W N N W N N N N W',
    '2': 'N N W W N N N N W',
    '3': 'W N W W N N N N N',
    '4': 'N N N W W N N N W',
    '5': 'W N N W W N N N N',
    '6': 'N N W W W N N N N',
    '7': 'N N N W N N W N W',
    '8': 'W N N W N N W N N',
    '9': 'N N W W N N W N N',
    'A': 'W N N N N W N N W',
    'B': 'N N W N N W N N W',
    'C': 'W N W N N W N N N',
    'D': 'N N N N W W N N W',
    'E': 'W N N N W W N N N',
    'F': 'N N W N W W N N N',
    'G': 'N N N N N W W N W',
    'H': 'W N N N N W W N N',
    'I': 'N N W N N W W N N',
    'J': 'N N N N W W W N N',
    '-': 'N N N W N N N W W',
    '.': 'W N N W N N N W N',
    ' ': 'N N W W N N N W N',
    '*': 'N N W N W N W N N' // Start/Stop
  };

  // Format value to upper case and wrap with start/stop asterisk
  const cleanValue = value.toUpperCase().replace(/[^0-9A-Z\-.\s]/g, '');
  const barcodeString = `*${cleanValue}*`;

  // Calculate widths
  const narrowWidth = width;
  const wideWidth = width * 2.8; // Standard Code 39 wide-to-narrow ratio is between 2.0 and 3.0
  const interCharacterGap = width;

  let totalWidth = 0;
  const elements: { isBar: boolean; width: number; x: number }[] = [];

  // Add Left Quiet Zone (minimum 10 narrow elements)
  const quietZoneWidth = narrowWidth * 10;
  totalWidth += quietZoneWidth;

  for (let i = 0; i < barcodeString.length; i++) {
    const char = barcodeString[i];
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) continue;

    const sequence = pattern.split(' ');
    sequence.forEach((symbol, index) => {
      const isBar = index % 2 === 0;
      const elWidth = symbol === 'W' ? wideWidth : narrowWidth;
      elements.push({
        isBar,
        width: elWidth,
        x: totalWidth
      });
      totalWidth += elWidth;
    });

    // Add inter-character gap after each character except the last one
    if (i < barcodeString.length - 1) {
      elements.push({
        isBar: false,
        width: interCharacterGap,
        x: totalWidth
      });
      totalWidth += interCharacterGap;
    }
  }

  // Add Right Quiet Zone
  totalWidth += quietZoneWidth;

  // Generate QR code base64 url
  useEffect(() => {
    if (renderType === 'qrcode' || renderType === 'both') {
      QRCode.toDataURL(value, {
        margin: 1,
        width: 160,
        errorCorrectionLevel: 'H', // High error correction level for easy camera scanning
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
    }
  }, [value, renderType]);

  return (
    <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs hover:shadow-2xs transition-all w-full" dir="ltr">
      
      {/* Container for code rendering based on renderType */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
        
        {/* BARCODE RENDER */}
        {(renderType === 'barcode' || renderType === 'both') && (
          <div className="flex flex-col items-center justify-center grow max-w-full">
            {/* SVG wrapper with absolute height and crisp pixel widths to prevent stretch distortion */}
            <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden w-full">
              <svg
                width={totalWidth}
                height={height}
                viewBox={`0 0 ${totalWidth} ${height}`}
                style={{ 
                  shapeRendering: 'crispEdges',
                  maxWidth: '100%',
                  height: `${height}px` 
                }}
                className="block"
              >
                {/* Clean white background to provide high contrast contrast */}
                <rect width={totalWidth} height={height} fill="#ffffff" />
                
                {elements.map((el, idx) => {
                  if (!el.isBar) return null;
                  return (
                    <rect
                      key={idx}
                      x={el.x}
                      y={0}
                      width={el.width}
                      height={height}
                      fill="#000000"
                    />
                  );
                })}
              </svg>
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
