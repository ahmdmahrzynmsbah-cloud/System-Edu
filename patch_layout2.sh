#!/bin/bash
sed -i 's/<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">/<div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center mb-6">/g' src/components/AttendanceTracker.tsx

sed -i 's/<div className="flex flex-wrap items-center gap-3">/<div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full xl:w-auto">/g' src/components/AttendanceTracker.tsx

sed -i 's/className="flex items-center h-9 gap-2 bg-slate-50 px-3 rounded-lg border border-slate-200"/className="flex items-center justify-between h-9 gap-2 bg-slate-50 px-3 rounded-lg border border-slate-200 w-full sm:w-auto shrink-0"/g' src/components/AttendanceTracker.tsx

sed -i 's/className="h-9 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 focus:border-\[#1A7FAA\] focus:ring-1 focus:ring-\[#1A7FAA\] outline-hidden cursor-pointer"/className="h-9 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 focus:border-\[#1A7FAA\] focus:ring-1 focus:ring-\[#1A7FAA\] outline-hidden cursor-pointer w-full sm:w-auto shrink-0"/g' src/components/AttendanceTracker.tsx

