const fs = require('fs');
let code = fs.readFileSync('src/utils/db.ts', 'utf8');

code = code.replace(
  '    const classes = this.getClasses();\n    const classObj = classes.find(c => c.id === id);\n    const className = classObj ? classObj.name : id;\n    const filtered = classes.filter(c => c.id !== id);\n    saveToStorage(KEYS.CLASSES, filtered);',
  '    const classes = loadFromStorage<ClassRoom[]>(KEYS.CLASSES, INITIAL_CLASSES);\n    const classObj = classes.find(c => c.id === id);\n    const className = classObj ? classObj.name : id;\n    const filtered = classes.filter(c => c.id !== id);\n    saveToStorage(KEYS.CLASSES, filtered);'
);

fs.writeFileSync('src/utils/db.ts', code);
