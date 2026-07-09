import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

old_pwa = """      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],"""

new_pwa = """      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 4000000
        },"""

content = content.replace(old_pwa, new_pwa)

with open('vite.config.ts', 'w') as f:
    f.write(content)

