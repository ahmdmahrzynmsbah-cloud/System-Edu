const fs = require('fs');
let code = fs.readFileSync('src/components/StudentBarcodes.tsx', 'utf8');

const oldCss = `.meta-row {
              font-size: 6.5px;
              font-weight: bold;
              color: #333333;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 0;
              direction: rtl !important;
              line-height: 1.2;
            }`;

const newCss = `.meta-row {
              font-size: 6.5px;
              font-weight: bold;
              color: #333333;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              margin: 0;
              direction: rtl !important;
              line-height: 1.2;
            }`;

code = code.replace(oldCss, newCss);

// Replace the second occurrence in the second template
const oldCss2 = `.meta-row {
              font-size: 7px;
              font-weight: bold;
              color: #333333;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 0;
              direction: rtl !important;
              line-height: 1.2;
            }`;

const newCss2 = `.meta-row {
              font-size: 7px;
              font-weight: bold;
              color: #333333;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              margin: 0;
              direction: rtl !important;
              line-height: 1.2;
            }`;

code = code.replace(oldCss2, newCss2);

// Fix the inline javascript logic
code = code.replace(
  /<div class="meta-row">المواعيد: <span style="font-size: 8px;">\$\{\(classroom\?\.schedule_days \|\| scheduleFormatted\)\.substring\(0, 30\)\}\$\{\(classroom\?\.schedule_days \|\| scheduleFormatted\)\.length > 30 \? '\.\.\.' : ''\}<\/span><\/div>/g,
  '<div class="meta-row" style="font-size: 6px;">المواعيد: <span>${scheduleFormatted}</span></div>'
);


fs.writeFileSync('src/components/StudentBarcodes.tsx', code);
