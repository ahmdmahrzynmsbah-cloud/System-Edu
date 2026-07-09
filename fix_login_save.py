import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """          setUsers(parsed);
          // Wait, saveSystemUser requires importing it. Is it imported?""",
    """          setUsers(parsed);
          await Promise.all(parsed.map(u => saveSystemUser(u)));"""
)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)
