const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  content = content.replace(/المنصة_/g, 'sams_');
  // Also we need to fix any samsDb reference if it was changed to المنصةDb
  content = content.replace(/المنصةDb/g, 'samsDb');
  // And SamsAgent to المنصةAgent ? I didn't replace 'Sams' since 'SAMS' is uppercase, wait, my regex was /SAMS/g, which is case-sensitive, so 'Sams' should be safe.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed: ' + filePath);
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
