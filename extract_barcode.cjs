const fs = require('fs');
let code = fs.readFileSync('src/components/StudentBarcodes.tsx', 'utf8');

const singlePrintReplacement = `
    const barcodeEl = document.getElementById(\`print-barcode-view-\${student.id}\`);
    const svgEl = barcodeEl?.querySelector('svg');
    const imgEl = barcodeEl?.querySelector('img');
    const spanEl = barcodeEl?.querySelector('span');
    
    let barcodeHtml = '';
    if (svgEl) {
      barcodeHtml += svgEl.outerHTML;
    }
    if (imgEl) {
      barcodeHtml += imgEl.outerHTML;
    }
    if (spanEl) {
      // Create a clean span with just the text
      barcodeHtml += \`<span>\${spanEl.innerText}</span>\`;
    }
`;

code = code.replace(
  /const barcodeHtml = document\.getElementById\(`print-barcode-view-\$\{student\.id\}`\)\?\.innerHTML \|\| '';/g,
  singlePrintReplacement
);

// We need to also clean up the `.barcode-wrapper` CSS because it no longer needs `> div > div` etc.
code = code.replace(/\.barcode-wrapper > div \{[\s\S]*?\}/g, '');
code = code.replace(/\.barcode-wrapper > div > div \{[\s\S]*?\}/g, '');

fs.writeFileSync('src/components/StudentBarcodes.tsx', code);
