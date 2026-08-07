const fs = require('fs');
let code = fs.readFileSync('src/components/StudentBarcodes.tsx', 'utf8');

// Single print CSS
code = code.replace(
  /\.barcode-wrapper \{\s*width: 100%;\s*height: 10mm;/g,
  '.barcode-wrapper {\n              width: 100%;\n              height: 14mm;'
);
code = code.replace(
  /\.barcode-wrapper svg \{\s*height: 7\.5mm !important;\s*max-width: 65% !important;/g,
  '.barcode-wrapper svg {\n              height: 12mm !important;\n              width: auto !important;\n              max-width: 90% !important;'
);

// Bulk print CSS
code = code.replace(
  /\.barcode-wrapper \{\s*width: 100%;\s*height: 11mm;/g,
  '.barcode-wrapper {\n              width: 100%;\n              height: 14mm;'
);
code = code.replace(
  /\.barcode-wrapper svg \{\s*height: 8\.5mm !important;\s*max-width: 65% !important;/g,
  '.barcode-wrapper svg {\n              height: 12mm !important;\n              width: auto !important;\n              max-width: 90% !important;'
);

fs.writeFileSync('src/components/StudentBarcodes.tsx', code);
