import re

with open('src/components/ClassesManager.tsx', 'r') as f:
    content = f.read()

# Add Users import
if 'Users, ' not in content:
    content = content.replace("User, Maximize2", "User, Users, Maximize2")

# Remove the old small button
old_button_pattern = r"""                  <button
                    onClick=\{\(\) => setSelectedClassView\(cls\)\}
                    className="p-1 text-\[\#0D5C8C\] hover:bg-blue-50 rounded transition-all cursor-pointer"
                    title="عرض الطلاب"
                  >
                    <ExternalLink className="w-3\.5 h-3\.5" />
                  </button>"""
content = re.sub(old_button_pattern, "", content)

# Add the new full-width button at the end of the card, right before the closing div of the card
old_card_end = """                )}
              </div>
            </div>"""

new_card_end = """                )}
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => setSelectedClassView(cls)}
                  className="w-full bg-blue-50 hover:bg-[#0D5C8C] text-[#0D5C8C] hover:text-white transition-colors py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold cursor-pointer border border-blue-100 shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  عرض تفاصيل وقائمة الطلاب
                </button>
              </div>
            </div>"""

content = content.replace(old_card_end, new_card_end)

with open('src/components/ClassesManager.tsx', 'w') as f:
    f.write(content)
