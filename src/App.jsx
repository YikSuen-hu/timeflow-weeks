import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Maximize2, Minimize2, Printer, Trash2,
  Clock, ChevronRight, ChevronLeft, Calendar, Layers, Settings,
  Plus, X, Save, RotateCcw, Edit2, Check, BarChart2
} from 'lucide-react';

// --- CSS for Print & Grid ---
const PrintStyles = () => (
  <style>{`
    @media print {
      @page {
        size: A4 portrait; 
        margin: 0;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background-color: white;
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      /* Hide everything by default */
      /* Hide everything by default using visibility to keep layout calculation if needed, 
         but mostly to allow specific children to be visible */
      body {
        visibility: hidden;
      }
      /* Only show the print area wrapper */
      #print-root {
        visibility: visible;
        display: block !important;
        position: absolute;
        top: 0;
        left: 0;
        width: 210mm;
        height: 297mm;
        overflow: hidden;
      }
      .print-area {
        display: flex !important;
        width: 210mm;
        height: 297mm;
        background: white;
        overflow: hidden;
        position: relative;
        box-shadow: none !important;
        margin: 0 !important;
        transform: none !important;
        align-items: flex-start;
      }
    }
    
    /* Strict Millimeter Sizing Classes */
    .w-4mm { width: 4mm !important; }
    .h-4mm { height: 4mm !important; }
    .w-28mm { width: 28mm !important; }
    .h-168mm { height: 168mm !important; }
  `}</style>
);

// --- Utilities ---
const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatTime = (dateObj) => dateObj.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};
const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_CATEGORIES = [
  { id: 'work', name: '工作', color: '#3b82f6' },
  { id: 'study', name: '学习', color: '#10b981' },
  { id: 'life', name: '生活', color: '#f59e0b' },
  { id: 'rest', name: '休息', color: '#8b5cf6' },
  { id: 'sport', name: '运动', color: '#ef4444' },
  { id: 'other', name: '其他', color: '#64748b' },
  { id: 'sub', name: '并行/副', color: '#a8a29e' },
];

const CategoryModal = ({ isOpen, onClose, categories, setCategories, resetCategories }) => {
  if (!isOpen) return null;
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');
  const [tempColor, setTempColor] = useState('#000000');

  const handleEdit = (cat) => { setEditingId(cat.id); setTempName(cat.name); setTempColor(cat.color); };
  const handleSave = () => { setCategories(categories.map(c => c.id === editingId ? { ...c, name: tempName, color: tempColor } : c)); setEditingId(null); };
  const handleAdd = () => { const newCat = { id: generateId(), name: '新分类', color: '#64748b' }; setCategories([...categories, newCat]); handleEdit(newCat); };
  const handleDelete = (id) => { if (categories.length <= 1) return alert("保留至少一个"); if (confirm("删除?")) setCategories(categories.filter(c => c.id !== id)); };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-80 max-h-[80vh] flex flex-col">
        <div className="p-3 border-b flex justify-between items-center"><h3 className="font-bold">标签设置</h3><button onClick={onClose}><X size={16} /></button></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              {editingId === cat.id ? (
                <>
                  <input type="color" value={tempColor} onChange={e => setTempColor(e.target.value)} className="w-6 h-6 rounded-full border-none" />
                  <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="flex-1 px-1 py-0.5 text-xs border rounded" autoFocus />
                  <button onClick={handleSave} className="text-green-500"><Check size={14} /></button>
                </>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="flex-1 text-xs font-bold">{cat.name}</span>
                  <button onClick={() => handleEdit(cat)} className="text-slate-400 hover:text-indigo-500"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(cat.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                </>
              )}
            </div>
          ))}
          <button onClick={handleAdd} className="w-full py-1.5 border border-dashed rounded-lg text-xs hover:bg-slate-50 flex justify-center items-center gap-1"><Plus size={14} /> 新增</button>
        </div>
        <div className="p-2 border-t text-right"><button onClick={resetCategories} className="text-[10px] text-red-400 flex items-center gap-1 ml-auto"><RotateCcw size={10} /> 重置默认</button></div>
      </div>
    </div>
  );
};

// --- Manual Entry Modal ---
const ManualEntryModal = ({ isOpen, onClose, categories, onSave }) => {
  if (!isOpen) return null;
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(30); // minutes

  const handleSave = () => {
    if (!name.trim()) return alert('请输入任务名称');
    const start = new Date(startTime);
    const durationSec = duration * 60;
    const task = {
      id: generateId(),
      name,
      categoryId,
      startTime: start.toISOString(),
      endTime: new Date(start.getTime() + durationSec * 1000).toISOString(),
      duration: durationSec,
      date: start.toISOString().split('T')[0],
      isManual: true
    };
    onSave(task);
    onClose();
    // Reset form slightly for next use
    setName('');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-80 p-4 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">补登专注记录</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">任务名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5 dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-indigo-500" autoFocus />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">分类</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-2 py-1 rounded text-xs border ${categoryId === cat.id ? 'ring-1 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: cat.color, borderColor: cat.color, color: 'white' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">开始时间</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full text-xs border rounded px-1 py-1.5 dark:bg-slate-900 dark:border-slate-700" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">时长 (分钟)</label>
              <input type="number" min="1" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full text-xs border rounded px-2 py-1.5 dark:bg-slate-900 dark:border-slate-700" />
            </div>
          </div>
          <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg mt-2 flex items-center justify-center gap-2">
            <Check size={16} /> 确认补登
          </button>
        </div>
      </div>
    </div>
  );
};

const TimerContainer = ({ currentTask, taskName, setTaskName, selectedCategoryId, setSelectedCategoryId, categories, startTimer, stopTimer, elapsed, currentSubTask, subTaskName, setSubTaskName, startSubTimer, stopSubTimer, subElapsed, isMiniMode, togglePiP, onOpenSettings }) => {
  const currentCat = currentTask ? categories.find(c => c.id === currentTask.categoryId) : null;
  return (
    <div className={`transition-all duration-300 ${isMiniMode ? 'fixed top-0 left-0 w-full h-full bg-white dark:bg-slate-900 p-2 flex flex-col overflow-hidden' : ''} no-print`}>
      <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-all mb-4 ${isMiniMode ? 'shadow-none border-none p-1 mb-1 rounded-xl flex-1 flex flex-col justify-center' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className={`font-bold text-slate-400 uppercase tracking-wider ${isMiniMode ? 'hidden' : 'text-sm'}`}>主任务</h2>
          <button onClick={togglePiP} className="text-slate-400 hover:text-indigo-500 ml-auto" title="PiP">{isMiniMode ? <Maximize2 size={14} /> : <Minimize2 size={16} />}</button>
        </div>
        {!currentTask ? (
          <div className={`space-y-4 ${isMiniMode ? 'space-y-2' : ''}`}>
            <input type="text" placeholder="专注内容..." className={`w-full font-medium bg-transparent border-b-2 focus:border-indigo-500 outline-none px-1 py-1 ${isMiniMode ? 'text-sm border-slate-100' : 'text-2xl border-slate-200'}`} value={taskName} onChange={(e) => setTaskName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && startTimer()} />
            {!isMiniMode ? (
              <div className="flex gap-2 flex-wrap mb-3">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} style={{ borderColor: selectedCategoryId === cat.id ? cat.color : 'transparent', backgroundColor: selectedCategoryId === cat.id ? `${cat.color}20` : 'transparent', color: selectedCategoryId === cat.id ? cat.color : '#64748b' }} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${selectedCategoryId !== cat.id ? 'bg-slate-50 border-slate-200' : ''}`}><span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: cat.color }}></span>{cat.name}</button>
                ))}
                <button onClick={onOpenSettings} className="px-2 py-1 rounded-full text-xs bg-slate-100 hover:bg-slate-200"><Settings size={14} /></button>
              </div>
            ) : (
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (<div key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={`w-3 h-3 flex-shrink-0 rounded-full cursor-pointer border ${selectedCategoryId === cat.id ? 'ring-1 ring-slate-400' : 'border-transparent'}`} style={{ backgroundColor: cat.color }} />))}
              </div>
            )}
            <button onClick={startTimer} disabled={!taskName.trim()} className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 ${isMiniMode ? 'py-2 text-sm' : 'py-4 text-lg'}`}><Play fill="currentColor" size={isMiniMode ? 12 : 24} /> {isMiniMode ? 'Go' : '开始专注'}</button>
          </div>
        ) : (
          <div className="text-center">
            <div className={`font-bold text-slate-800 dark:text-white truncate ${isMiniMode ? 'text-base mb-1' : 'text-3xl mb-2'}`}>{currentTask.name}</div>
            <div className="text-xs text-slate-400 mb-2 flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentCat?.color || '#ccc' }}></span>{currentCat?.name || '未知'}</div>
            <div className={`font-mono font-bold tracking-tighter tabular-nums ${isMiniMode ? 'text-4xl mb-2' : 'text-7xl mb-6'}`}>{formatDuration(elapsed)}</div>
            <button onClick={stopTimer} className={`w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 group ${isMiniMode ? 'py-1.5 text-xs' : 'py-4 text-lg'}`}><Square fill="currentColor" size={isMiniMode ? 12 : 20} className="group-hover:scale-90" /> {isMiniMode ? 'Stop' : '结束任务'}</button>
          </div>
        )}
      </div>
      <div className={`bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 ${isMiniMode ? 'border-none p-1 bg-transparent' : ''}`}>
        {!currentSubTask ? (
          <div className="flex gap-2">
            <input type="text" placeholder="并行..." className="flex-1 text-xs bg-white dark:bg-slate-800 border rounded-lg px-2 py-1 outline-none" value={subTaskName} onChange={(e) => setSubTaskName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && startSubTimer()} />
            <button onClick={startSubTimer} className="p-1.5 bg-slate-200 rounded-lg"><Play size={12} fill="currentColor" /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white p-2 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><Layers size={10} className="text-orange-500" /></div>
              <div className="min-w-0"><div className="text-xs font-bold truncate">{currentSubTask.name}</div><div className="text-[10px] font-mono text-slate-500">{formatDuration(subElapsed)}</div></div>
            </div>
            <button onClick={stopSubTimer} className="p-1 text-slate-400 hover:text-red-500"><Square size={12} fill="currentColor" /></button>
          </div>
        )}
      </div>
    </div>
  );
};

const WeeksLayout = ({ viewDate, tasks, categories, onOpenManualEntry }) => {
  const currentDate = new Date(viewDate);
  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const rangeStart = new Date(d); rangeStart.setHours(7, 0, 0, 0);
    const rangeEnd = new Date(d); rangeEnd.setDate(d.getDate() + 1); rangeEnd.setHours(7, 0, 0, 0);
    const dayTasks = tasks.filter(t => { const tStart = new Date(t.startTime); return tStart >= rangeStart && tStart < rangeEnd; });
    return { date: d.toISOString().split('T')[0], dayName: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()], dayNum: d.getDate(), tasks: dayTasks, totalDuration: dayTasks.reduce((acc, t) => acc + t.duration, 0) };
  });

  const totalWeekDuration = weekDays.reduce((acc, day) => acc + day.totalDuration, 0);
  const categoryStats = categories.map(cat => ({
    ...cat, duration: tasks.filter(t => new Date(t.startTime) >= startOfWeek && new Date(t.startTime) <= endOfWeek && t.categoryId === cat.id).reduce((acc, t) => acc + t.duration, 0)
  })).filter(c => c.duration > 0);
  const maxCatDuration = Math.max(...categoryStats.map(c => c.duration), 1);

  // Position Helpers (Strict 4mm)
  // Rows 0-17 (7am-0am) -> 2 cells/hr
  // Rows 18-41 (0am-7am) -> ? User said 7am-1am=36cells, 1am-7am=6cells.
  // 7am-1am (18 hours) * 2 = 36 cells.
  // 1am-7am (6 hours) * 1 = 6 cells.
  // Total 42 cells. Each cell 4mm.
  const getPosition = (start, durationSec) => {
    let h = start.getHours();
    let m = start.getMinutes();
    // Normalize to minutes from 07:00
    let minsFrom7 = (h >= 7) ? (h - 7) * 60 + m : (17 + h) * 60 + m;

    const mapMinsToCells = (min) => {
      if (min <= 18 * 60) return min / 30; // 2 cells/hr
      return 36 + (min - 18 * 60) / 60; // 1 cell/hr
    };

    const startCell = mapMinsToCells(minsFrom7);
    const endCell = mapMinsToCells(minsFrom7 + durationSec / 60);

    // Top px = startCell * 4mm
    // Height px = (endCell - startCell) * 4mm
    return { top: `${startCell * 4}mm`, height: `${Math.max((endCell - startCell) * 4, 2)}mm` };
  };

  return (
    <div className="print-area flex flex-row">
      {/* --- LEFT: TIMELINE STRIP (Strict 28mm wide grid + Axis) --- */}
      <div className="flex-shrink-0 pt-[10mm] mr-4 h-full relative" style={{ marginLeft: '5mm', marginRight: '5mm' }}>
        <div className="flex h-full">
          {/* Axis */}
          <div className="w-8 flex-shrink-0 flex flex-col mr-1">
            {/* Spacer to match Header height exactly (including border thickness) */}
            <div className="h-[10mm] border-b border-transparent mb-[1px]" />

            <div className="relative w-full h-[168mm]">
              {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6].map((h, i) => {
                // Y position in cells
                let cellY = i < 18 ? i * 2 : 36 + (i - 18);
                return (
                  <div key={i} className="absolute w-full text-right text-[8px] text-slate-400 font-mono leading-none border-t border-slate-200 pr-1"
                    style={{ top: `${cellY * 4}mm`, height: i < 18 ? '8mm' : '4mm' }}>
                    <span className="-translate-y-1/2 block">{h}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* The 28mm Strip */}
          <div className="flex flex-col w-[28mm]">
            {/* Header */}
            <div className="flex h-[10mm] border-b border-black items-end pb-1 mb-[1px]">
              {weekDays.map(day => (
                <div key={day.date} className="w-[4mm] text-center flex flex-col justify-end">
                  <div className="text-[6px] text-slate-500 uppercase leading-none scale-75">{day.dayName}</div>
                  <div className="font-bold text-[8px] leading-none">{day.dayNum}</div>
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="relative w-[28mm] h-[168mm] border-t border-slate-200 border-r border-slate-300">
              {/* BG Grid Lines (42 Rows) */}
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="absolute w-full border-b border-slate-100 box-border" style={{ top: `${(i + 1) * 4}mm`, height: '0' }}></div>
              ))}
              {/* BG Cols (7 Cols) */}
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="absolute h-full border-r border-slate-100 box-border" style={{ left: `${(i + 1) * 4}mm`, width: '0' }}></div>
              ))}

              {/* Columns & Tasks */}
              <div className="absolute inset-0 flex">
                {weekDays.map(day => (
                  <div key={day.date} className="w-[4mm] relative h-full border-r border-slate-200 box-border">
                    {day.tasks.map(t => {
                      const pos = getPosition(new Date(t.startTime), t.duration);
                      const cat = categories.find(c => c.id === t.categoryId) || { color: '#ccc' };
                      return (
                        <div key={t.id}
                          className="absolute left-[0.2mm] right-[0.2mm] rounded-[1px] overflow-hidden flex items-center justify-center border border-white/30"
                          style={{ top: pos.top, height: pos.height, backgroundColor: cat.color, zIndex: 10 }}
                        >
                          <span className="text-white text-[3px] font-bold tracking-tight opacity-90 block"
                            style={{ writingMode: 'vertical-rl', textOrientation: 'upright', maxHeight: '100%' }}>
                            {t.name.slice(0, 3)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT: DASHBOARD (Fills remaining space) --- */}
      <div className="flex-1 flex flex-col pt-[10mm] pr-[10mm] h-full">
        {/* Top Header */}
        <div className="flex justify-between items-end border-b-2 border-slate-800 pb-2 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-800">{startOfWeek.getFullYear()}</h1>
              <div className="text-sm text-slate-500 font-mono tracking-widest uppercase">Weekly Report</div>
            </div>
            <button onClick={onOpenManualEntry} className="mb-2 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 no-print" title="补登记录">
              <Plus size={12} /> 补登
            </button>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">{startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}</div>
            <div className="text-xs text-slate-400">Total Focus: {formatDuration(totalWeekDuration)}</div>
          </div>
        </div>

        {/* Canvas Area split into Stats and Memo */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Visual Stats Chart */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 print:border-slate-200">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><BarChart2 size={16} /> CATEGORY BREAKDOWN</h3>
            <div className="flex gap-4 items-end h-[40mm]">
              {categoryStats.map(cat => {
                const hPct = (cat.duration / maxCatDuration) * 100;
                return (
                  <div key={cat.id} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-auto">{formatDuration(cat.duration)}</div>
                    <div className="w-full bg-slate-200 rounded-t-sm relative overflow-hidden transition-all hover:brightness-95" style={{ height: `${Math.max(hPct, 2)}%` }}>
                      <div className="absolute inset-0 opacity-80" style={{ backgroundColor: cat.color }}></div>
                    </div>
                    <div className="text-[10px] whitespace-nowrap overflow-hidden text-ellipsis w-full text-center text-slate-500 font-medium">{cat.name}</div>
                  </div>
                )
              })}
              {categoryStats.length === 0 && <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">No data recorded</div>}
            </div>
          </div>

          {/* Memo Area */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-400">MEMO & ANALYSIS</h3>
            <div
              className="flex-1 border border-slate-200 rounded-xl p-4 text-xs leading-relaxed outline-none focus:ring-1 focus:ring-slate-300 text-slate-700 resize-none font-sans grid-pattern-4mm bg-white"
              contentEditable
              suppressContentEditableWarning
            >
              Write your weekly review here...
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-300">
            <div>TimeFlow Weeks • Generated Report</div>
            <div className="font-mono">4mm Grid System v5.0</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORIES[0].id);
  const [currentSubTask, setCurrentSubTask] = useState(null);
  const [subTaskName, setSubTaskName] = useState('');
  const [subElapsed, setSubElapsed] = useState(0);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const timerRef = useRef(null);
  const subTimerRef = useRef(null);
  const pipWindowRef = useRef(null);

  useEffect(() => {
    try {
      if (localStorage.getItem('timeflow_categories')) setCategories(JSON.parse(localStorage.getItem('timeflow_categories')));
      if (localStorage.getItem('timeflow_tasks')) setTasks(JSON.parse(localStorage.getItem('timeflow_tasks')));
      if (localStorage.getItem('timeflow_current')) setCurrentTask(JSON.parse(localStorage.getItem('timeflow_current')));
      if (localStorage.getItem('timeflow_sub_current')) setCurrentSubTask(JSON.parse(localStorage.getItem('timeflow_sub_current')));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { localStorage.setItem('timeflow_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('timeflow_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { if (currentTask) localStorage.setItem('timeflow_current', JSON.stringify(currentTask)); else localStorage.removeItem('timeflow_current'); }, [currentTask]);
  useEffect(() => { if (currentSubTask) localStorage.setItem('timeflow_sub_current', JSON.stringify(currentSubTask)); else localStorage.removeItem('timeflow_sub_current'); }, [currentSubTask]);

  useEffect(() => { if (currentTask) { const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(currentTask.startTime).getTime()) / 1000))); calc(); timerRef.current = setInterval(calc, 1000); } else { clearInterval(timerRef.current); setElapsed(0); } return () => clearInterval(timerRef.current); }, [currentTask]);
  useEffect(() => { if (currentSubTask) { const calc = () => setSubElapsed(Math.max(0, Math.floor((Date.now() - new Date(currentSubTask.startTime).getTime()) / 1000))); calc(); subTimerRef.current = setInterval(calc, 1000); } else { clearInterval(subTimerRef.current); setSubElapsed(0); } return () => clearInterval(subTimerRef.current); }, [currentSubTask]);

  const startTimer = () => { if (!taskName.trim()) return; setCurrentTask({ id: generateId(), name: taskName, startTime: new Date().toISOString(), duration: 0, categoryId: selectedCategoryId }); };
  const stopTimer = () => { if (!currentTask) return; setTasks([{ ...currentTask, endTime: new Date().toISOString(), duration: elapsed, date: new Date().toISOString().split('T')[0] }, ...tasks]); setCurrentTask(null); setTaskName(''); setElapsed(0); };
  const startSubTimer = () => { if (!subTaskName.trim()) return; setCurrentSubTask({ id: generateId(), name: subTaskName, startTime: new Date().toISOString(), duration: 0, categoryId: (categories.find(c => c.id === 'sub') || categories[0]).id }); };
  const stopSubTimer = () => { if (!currentSubTask) return; setTasks([{ ...currentSubTask, endTime: new Date().toISOString(), duration: subElapsed, date: new Date().toISOString().split('T')[0] }, ...tasks]); setCurrentSubTask(null); setSubTaskName(''); setSubElapsed(0); };

  const handleManualTask = (task) => {
    setTasks(prev => [...prev, task]);
  };

  const togglePiP = async () => {
    if (pipWindowRef.current) { pipWindowRef.current.close(); return; }
    if (!window.documentPictureInPicture) { setIsMiniMode(!isMiniMode); return; }
    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 280, height: 360 });
      pipWindowRef.current = pipWindow;
      setIsMiniMode(true);
      Array.from(document.styleSheets).forEach(s => { try { if (s.href) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = s.href; pipWindow.document.head.appendChild(l); } else if (s.cssRules) { const st = document.createElement('style'); st.textContent = [...s.cssRules].map(r => r.cssText).join(''); pipWindow.document.head.appendChild(st); } } catch (e) { } });
      const c = document.getElementById('unified-timer-container');
      if (c) pipWindow.document.body.appendChild(c);
      pipWindow.addEventListener('pagehide', () => { const r = document.getElementById('unified-timer-root'); if (r && c) r.appendChild(c); pipWindowRef.current = null; setIsMiniMode(false); });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 transition-colors pb-20">
      <PrintStyles />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} setCategories={setCategories} resetCategories={() => setCategories(DEFAULT_CATEGORIES)} />
      <ManualEntryModal isOpen={isManualEntryModalOpen} onClose={() => setIsManualEntryModalOpen(false)} categories={categories} onSave={handleManualTask} />

      {/* NO PRINT UI */}
      <div className="no-print pt-6 px-6 mb-4 flex justify-between items-center max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TimeFlow Weeks</h1>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-white shadow-sm" onClick={() => window.print()}><Printer size={20} className="text-slate-600" /></button>
          <button className="p-2 rounded-full hover:bg-white shadow-sm" onClick={() => setIsCategoryModalOpen(true)}><Settings size={20} className="text-slate-600" /></button>
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-xl relative no-print">
        <div id="unified-timer-root"><div id="unified-timer-container"><TimerContainer currentTask={currentTask} taskName={taskName} setTaskName={setTaskName} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} categories={categories} startTimer={startTimer} stopTimer={stopTimer} elapsed={elapsed} currentSubTask={currentSubTask} subTaskName={subTaskName} setSubTaskName={setSubTaskName} startSubTimer={startSubTimer} stopSubTimer={stopSubTimer} subElapsed={subElapsed} isMiniMode={isMiniMode} togglePiP={togglePiP} onOpenSettings={() => setIsCategoryModalOpen(true)} /></div></div>
      </div>

      {/* PRINT ROOT - Enforce Flex Layout */}
      <div id="print-root">
        <div className="print-area">
          <WeeksLayout viewDate={viewDate} tasks={tasks} categories={categories} onOpenManualEntry={() => setIsManualEntryModalOpen(true)} />
        </div>
      </div>
    </div>
  );
}
