import re

with open('src/components/ParentsList.tsx', 'r') as f:
    content = f.read()

old_actions = """                        {/* Actions */}
                        <td className="p-4 text-left flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(parent)}
                            title="تعديل بيانات ولي الأمر والتواصل"
                            className="p-1.5 text-slate-500 hover:text-[#0D5C8C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <a
                            href={parent.parent_phone ? `https://wa.me/${parent.parent_phone.startsWith('0') ? '2' + parent.parent_phone : parent.parent_phone}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="مراسلة سريعة عبر الواتساب"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              parent.parent_phone 
                                ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' 
                                : 'text-slate-300 pointer-events-none'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        </td>"""

new_actions = """                        {/* Actions */}
                        <td className="p-4 text-left flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(parent)}
                            title="تعديل بيانات ولي الأمر والتواصل"
                            className="p-1.5 text-slate-500 hover:text-[#0D5C8C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <a
                            href={parent.parent_phone ? `https://wa.me/${parent.parent_phone.startsWith('0') ? '2' + parent.parent_phone : parent.parent_phone}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="مراسلة سريعة عبر الواتساب"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              parent.parent_phone 
                                ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' 
                                : 'text-slate-300 pointer-events-none'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                          <a
                            href={parent.parent_phone ? `https://t.me/+${parent.parent_phone.startsWith('0') ? '2' + parent.parent_phone : parent.parent_phone}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="مراسلة سريعة عبر تيليجرام"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              parent.parent_phone 
                                ? 'text-sky-600 hover:bg-sky-50 hover:text-sky-700' 
                                : 'text-slate-300 pointer-events-none'
                            }`}
                          >
                            <Send className="w-4 h-4 -ml-0.5" />
                          </a>
                        </td>"""

content = content.replace(old_actions, new_actions)

with open('src/components/ParentsList.tsx', 'w') as f:
    f.write(content)

