const fs = require('fs');
let code = fs.readFileSync('src/components/StudentsList.tsx', 'utf8');

const desktopDelete = `<button onClick={() => handleDeleteClick(student)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="أرشفة وحذف">
                            <Trash2 className="w-4 h-4" />
                          </button>`;

const desktopArchive = `{student.is_archived ? (
                            <button onClick={() => setStudentToRestore(student)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="استعادة من الأرشيف">
                              <ArchiveRestore className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => setStudentToArchive(student)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="أرشفة الطالب">
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteClick(student)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف نهائي">
                            <Trash2 className="w-4 h-4" />
                          </button>`;

code = code.replace(desktopDelete, desktopArchive);

const mobileDelete = `<button onClick={() => handleDeleteClick(student)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-150 bg-slate-50/50 cursor-pointer" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>`;

const mobileArchive = `{student.is_archived ? (
                      <button onClick={() => setStudentToRestore(student)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg border border-slate-150 bg-slate-50/50 cursor-pointer" title="استعادة من الأرشيف">
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => setStudentToArchive(student)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg border border-slate-150 bg-slate-50/50 cursor-pointer" title="أرشفة الطالب">
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteClick(student)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-slate-150 bg-slate-50/50 cursor-pointer" title="حذف نهائي">
                      <Trash2 className="w-4 h-4" />
                    </button>`;

code = code.replace(mobileDelete, mobileArchive);

fs.writeFileSync('src/components/StudentsList.tsx', code);
