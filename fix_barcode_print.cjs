const fs = require('fs');
let code = fs.readFileSync('src/components/StudentBarcodes.tsx', 'utf8');

// The issue might be that `.barcode-wrapper > div > div > div` isn't properly cleared of padding/border,
// and the span isn't centering. Let's add some rules.

const oldRulesSingle = `.barcode-wrapper > div > div {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 2mm !important;
              width: 100% !important;
              direction: ltr !important;
            }
            .barcode-wrapper svg {
              height: 12mm !important;
              width: auto !important;
              max-width: 90% !important;
              display: block !important;
              margin: 0 !important;
            }`;

const newRulesSingle = `.barcode-wrapper > div > div {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: center !important;
              width: 100% !important;
              direction: ltr !important;
            }
            .barcode-wrapper > div > div > div {
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .barcode-wrapper > div > div > div > div {
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .barcode-wrapper svg {
              height: 11mm !important;
              width: 100% !important;
              max-width: 38mm !important;
              display: block !important;
              margin: 0 auto !important;
            }`;

code = code.replace(oldRulesSingle, newRulesSingle);
code = code.replace(oldRulesSingle, newRulesSingle); // Replace twice in case both matched exactly (they might not if one was edited differently)

// Let's replace by regex instead to be safe since I edited them before
code = code.replace(/\.barcode-wrapper > div > div \{[\s\S]*?\.barcode-wrapper svg \{[\s\S]*?\}/g, newRulesSingle);

// Fix span centering
code = code.replace(/\.barcode-wrapper span \{[\s\S]*?\}/g, `.barcode-wrapper span {
              font-family: monospace !important;
              font-size: 7px !important;
              color: #000000 !important;
              margin-top: 1mm !important;
              letter-spacing: 2px !important;
              font-weight: bold !important;
              direction: ltr !important;
              display: block !important;
              text-align: center !important;
              width: 100% !important;
            }`);

fs.writeFileSync('src/components/StudentBarcodes.tsx', code);
