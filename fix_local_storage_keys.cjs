const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  content = content.replace(/sams_custom_app_name/g, 'sams_custom_app_name_v2');
  content = content.replace(/sams_custom_app_logo/g, 'sams_custom_app_logo_v2');
  content = content.replace(/sams_custom_header_title/g, 'sams_custom_header_title_v2');
  content = content.replace(/sams_custom_header_subtitle/g, 'sams_custom_header_subtitle_v2');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed keys: ' + filePath);
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
