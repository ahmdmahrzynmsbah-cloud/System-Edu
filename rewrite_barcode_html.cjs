const fs = require('fs');
let code = fs.readFileSync('src/components/StudentBarcodes.tsx', 'utf8');

const regex = /const barcodeEl = document\.getElementById\(`print-barcode-view-\$\{student\.id\}`\);[\s\S]*?if \(spanEl\) \{[\s\S]*?\}\n/g;

const newExtraction = `
    const barcodeEl = document.getElementById(\`print-barcode-view-\${student.id}\`);
    const svgEl = barcodeEl?.querySelector('svg');
    const imgEl = barcodeEl?.querySelector('img');
    const spanEl = barcodeEl?.querySelector('span');
    
    let barcodeHtml = '';
    
    if (svgEl && imgEl) {
       barcodeHtml = \`<div style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 2mm; width: 100%;">
         <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;">
           \${svgEl.outerHTML}
           \${spanEl ? \`<span>\${spanEl.innerText}</span>\` : ''}
         </div>
         <div style="display: flex; align-items: center; justify-content: center;">
           \${imgEl.outerHTML}
         </div>
       </div>\`;
    } else if (svgEl) {
       barcodeHtml = \`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
         \${svgEl.outerHTML}
         \${spanEl ? \`<span>\${spanEl.innerText}</span>\` : ''}
       </div>\`;
    } else if (imgEl) {
       barcodeHtml = \`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
         \${imgEl.outerHTML}
         \${spanEl ? \`<span>\${spanEl.innerText}</span>\` : ''}
       </div>\`;
    }
`;

code = code.replace(regex, newExtraction);

fs.writeFileSync('src/components/StudentBarcodes.tsx', code);
