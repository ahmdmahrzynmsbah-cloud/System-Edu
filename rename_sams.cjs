const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  content = content.replace(/SAMS AI/g, 'منصة الإدارة');
  content = content.replace(/نظام SAMS AI/g, 'نظام الإدارة');
  content = content.replace(/منصة SAMS المتكاملة/g, 'المنصة التعليمية المتكاملة');
  content = content.replace(/أكاديمية SAMS التعليمية/g, 'الأكاديمية التعليمية');
  content = content.replace(/SAMS v2\.5/g, 'v2.5');
  content = content.replace(/SAMS/g, 'المنصة');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

traverseDir('src');
