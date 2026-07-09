import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("  PanelRightOpen,\n} from 'lucide-react';", "  PanelRightOpen,\n  AlertCircle,\n} from 'lucide-react';")

with open('src/App.tsx', 'w') as f:
    f.write(content)
