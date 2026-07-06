const fs = require('fs');
let code = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');
code = code.replace(/<\/form>[\s\S]*$/, `</form>\n        </div>\n      </div>\n    </div>\n  );\n}\n`);
fs.writeFileSync('src/components/LoginScreen.tsx', code);
