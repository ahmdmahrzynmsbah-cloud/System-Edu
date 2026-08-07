const fs = require('fs');
let code = fs.readFileSync('src/components/StudentBarcodes.tsx', 'utf8');

// The react-barcode component generates an SVG inside a div, so let's make sure that's clear in the CSS
const printCssPatch = `.barcode-wrapper svg {
              height: 11mm !important;
              width: 100% !important;
              max-width: 38mm !important;
              display: block !important;
              margin: 0 auto !important;
            }`;

const newPrintCss = `.barcode-wrapper svg {
              height: 11mm !important;
              width: auto !important;
              max-width: 100% !important;
              display: block !important;
              margin: 0 auto !important;
            }`;

code = code.replace(printCssPatch, newPrintCss);

// Also let's fix the bulk print one 
const bulkPrintCssPatch = `.barcode-wrapper svg {
              height: 11mm !important;
              width: 100% !important;
              max-width: 38mm !important;
              display: block !important;
              margin: 0 auto !important;
            }`;

code = code.replace(bulkPrintCssPatch, newPrintCss);

// We should also remove the `.barcode-wrapper > div > div > div` overrides since the HTML structure changed with react-barcode.
code = code.replace(/\.barcode-wrapper > div > div > div \{[\s\S]*?\}/g, '');
code = code.replace(/\.barcode-wrapper > div > div > div > div \{[\s\S]*?\}/g, '');

fs.writeFileSync('src/components/StudentBarcodes.tsx', code);
