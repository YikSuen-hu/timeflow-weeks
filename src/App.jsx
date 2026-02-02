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
      body > * {
        display: none !important;
      }
      /* Only show the print area wrapper */
      #print-root {
        display: block !important;
        position: absolute;
        top: 0;
        left: 0;
        width: 210mm;
        height: 297mm;
        overflow: hidden;
      }
      .print-area {
        display: block !important;
        width: 210mm;
        height: 297mm;
        background: white;
        overflow: hidden;
        position: relative;
        box-shadow: none !important;
        margin: 0 !important;
        transform: none !important;
      }
      /* Flatten the layout for print */
      .print-layout-row {
        flex-direction: row !important;
        display: flex !important;
      }
    }
  `}</style>
);

// --- Utilities ---
const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  } else {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
};

const formatTime = (dateObj) => {
  return dateObj.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// 默认分类
const DEFAULT_CATEGORIES = [
  { id: 'work', name: '工作', color: '#3b82f6' },
  { id: 'study', name: '学习', color: '#10b981' },
  { id: 'life', name: '生活', color: '#f59e0b' },
  { id: 'rest', name: '休息', color: '#8b5cf6' },
  { id: 'sport', name: '运动', color: '#ef4444' },
  { id: 'other', name: '其他', color: '#64748b' },
  { id: 'sub', name: '并行/副', color: '#a8a29e' },
];

// --- Components ---

const CategoryModal = ({ isOpen, onClose, categories, setCategories, resetCategories }) => {
  if (!isOpen) return null;
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState('');
  const [tempColor, setTempColor] = useState('#000000');

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setTempName(cat.name);
    setTempColor(cat.color);
  };

  const handleSave = () => {
    setCategories(categories.map(c => c.id === editingId ? { ...c, name: tempName, color: tempColor } : c));
    setEditingId(null);
  };

  const handleAdd = () => {
    const newCat = { id: generateId(), name: '新分类', color: '#64748b' };
    setCategories([...categories, newCat]);
    handleEdit(newCat);
  };

  const handleDelete = (id) => {
    if (categories.length <= 1) return alert("至少保留一个分类");
    if (confirm("删除此分类？")) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-96 max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg">分类设置</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              {editingId === cat.id ? (
                <>
                  <input type="color" value={tempColor} onChange={e => setTempColor(e.target.value)} className="w-8 h-8 rounded-full overflow-hidden border-none cursor-pointer" />
                  <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="flex-1 px-2 py-1 text-sm border rounded" autoFocus />
                  <button onClick={handleSave} className="p-1 text-green-500 hover:bg-green-100 rounded"><Check size={16} /></button>
                </>
              ) : (
                <>
                  <span className="w-6 h-6 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span className="flex-1 font-bold text-sm">{cat.name}</span>
                  <button onClick={() => handleEdit(cat)} className="p-1 text-slate-400 hover:text-indigo-500"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </>
              )}
            </div>
          ))}
          <button onClick={handleAdd} className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-500 transition-colors">
            <Plus size={16} /> 添加分类
          </button>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
          <button onClick={resetCategories} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
            <RotateCcw size={12} /> 恢复默认
          </button>
        </div>
      </div>
    </div>
  );
};

const CategorySelector = ({ categories, selectedId, onSelect, onOpenSettings }) => (
  <div className="flex gap-2 flex-wrap mb-3">
    {categories.map(cat => (
      <button
        key={cat.id}
        onClick={() => onSelect(cat.id)}
        style={{
          borderColor: selectedId === cat.id ? cat.color : 'transparent',
          backgroundColor: selectedId === cat.id ? `${cat.color}20` : 'transparent',
          color: selectedId === cat.id ? cat.color : '#64748b'
        }}
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5
          ${selectedId !== cat.id ? 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700 hover:border-slate-300' : ''}`}
      >
        <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></span>
        {cat.name}
      </button>
    ))}
    <button
      onClick={onOpenSettings}
      className="px-2 py-1 rounded-full text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <Settings size={14} />
    </button>
  </div>
);

const TimerContainer = ({
  currentTask, taskName, setTaskName, selectedCategoryId, setSelectedCategoryId, categories,
  startTimer, stopTimer, elapsed,
  currentSubTask, subTaskName, setSubTaskName, startSubTimer, stopSubTimer, subElapsed,
  isMiniMode, togglePiP, onOpenSettings
}) => {
  const currentCat = currentTask ? categories.find(c => c.id === currentTask.categoryId) : null;

  return (
    <div className={`transition-all duration-300 ${isMiniMode ? 'fixed top-0 left-0 w-full h-full bg-white dark:bg-slate-900 p-2 flex flex-col justify-center overflow-hidden' : ''} no-print`}>
      {/* Main Timer */}
      <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-all mb-4 ${isMiniMode ? 'shadow-none border-none p-2 mb-2 rounded-xl' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className={`font-bold text-slate-400 uppercase tracking-wider ${isMiniMode ? 'text-[10px]' : 'text-sm'}`}>主任务</h2>
          <button onClick={togglePiP} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Toggle Floating Window">
            {isMiniMode ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>

        {!currentTask ? (
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="专注内容..."
                className={`w-full font-medium bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none px-1 py-1 transition-colors placeholder:text-slate-300 font-sans ${isMiniMode ? 'text-lg' : 'text-2xl'}`}
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startTimer()}
              />
            </div>
            {!isMiniMode && (
              <CategorySelector
                categories={categories}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                onOpenSettings={onOpenSettings}
              />
            )}
            {isMiniMode && (
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <div key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-3 h-3 rounded-full cursor-pointer border ${selectedCategoryId === cat.id ? 'ring-2 ring-offset-1 ring-slate-400' : 'border-transparent'}`}
                    style={{ backgroundColor: cat.color }}
                    title={cat.name}
                  />
                ))}
              </div>
            )}
            <button
              onClick={startTimer}
              disabled={!taskName.trim()}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 ${isMiniMode ? 'py-2 text-sm' : 'py-4 text-lg'}`}
            >
              <Play fill="currentColor" size={isMiniMode ? 14 : 24} /> {isMiniMode ? '开始' : '开始专注'}
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            {!isMiniMode && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-4">
                <span className="w-2 h-2 rounded-full animate-pulse bg-indigo-500"></span> 专注中
              </div>
            )}
            <h2 className={`font-bold text-slate-800 dark:text-white mb-1 px-4 truncate ${isMiniMode ? 'text-lg' : 'text-3xl'}`}>{currentTask.name}</h2>
            <div className="text-xs text-slate-400 mb-2 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentCat?.color || '#ccc' }}></span>
              {currentCat?.name || '未知'}
            </div>
            <div className={`font-mono font-bold text-slate-800 dark:text-white tracking-tighter mb-4 tabular-nums ${isMiniMode ? 'text-4xl' : 'text-7xl'}`}>
              {formatDuration(elapsed)}
            </div>
            <button
              onClick={stopTimer}
              className={`w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group ${isMiniMode ? 'py-2 text-sm' : 'py-4 text-lg'}`}
            >
              <Square fill="currentColor" size={isMiniMode ? 14 : 20} className="group-hover:scale-110 transition-transform" /> {isMiniMode ? '结束' : '结束任务'}
            </button>
          </div>
        )}
      </div>

      {/* Sub Timer */}
      <div className={`bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 mb-8 ${isMiniMode ? 'border-none p-2 bg-slate-50 dark:bg-slate-800 mb-0 rounded-xl' : ''}`}>
        <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">副任务</div>
        {!currentSubTask ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="并行..."
              className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 outline-none focus:border-slate-400"
              value={subTaskName}
              onChange={(e) => setSubTaskName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startSubTimer()}
            />
            <button
              onClick={startSubTimer}
              disabled={!subTaskName.trim()}
              className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              <Play size={12} fill="currentColor" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Layers size={10} className="text-orange-500" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{currentSubTask.name}</div>
                <div className="text-[10px] font-mono text-slate-500">{formatDuration(subElapsed)}</div>
              </div>
            </div>
            <button
              onClick={stopSubTimer}
              className="p-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Square size={12} fill="currentColor" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const WeeksLayout = ({ viewDate, tasks, categories }) => {
  const currentDate = new Date(viewDate);
  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  // Custom Notes State (in-memory for now, simple implementation)
  const [notes, setNotes] = useState("Click to add notes...");

  const hoursMap = [
    7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    0,
    1, 2, 3, 4, 5, 6
  ];

  const getTopAndHeight = (start, durationSec) => {
    const getVisualOffset = (d) => {
      let h = d.getHours();
      let m = d.getMinutes();
      if (h >= 7) return (h - 7) * 60 + m;
      else return (17 + h) * 60 + m;
    };

    const mapMinutesToCells = (min) => {
      const threshold = 18 * 60;
      if (min <= threshold) return min / 30;
      else return 36 + ((min - threshold) / 60);
    };

    const startOffset = getVisualOffset(start);
    const endOffset = startOffset + (durationSec / 60);

    // Explicit 42 Rows Grid alignment
    // We want to snap to the nearest "sub-grid" if possible, but exact % is fine
    const startCell = mapMinutesToCells(startOffset);
    const endCell = mapMinutesToCells(endOffset);

    // Convert to row index (1-based) for CSS Grid if we were using it, 
    // but here we use absolute %.
    // Total 42 "units" high.

    const top = (startCell / 42) * 100;
    const height = ((endCell - startCell) / 42) * 100;

    return { top: `${top}%`, height: `${Math.max(height, 0.5)}%` };
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const rangeStart = new Date(d); rangeStart.setHours(7, 0, 0, 0);
    const rangeEnd = new Date(d); rangeEnd.setDate(d.getDate() + 1); rangeEnd.setHours(7, 0, 0, 0);
    const dayTasks = tasks.filter(t => { const tStart = new Date(t.startTime); return tStart >= rangeStart && tStart < rangeEnd; });
    const totalDuration = dayTasks.reduce((acc, t) => acc + t.duration, 0);
    return {
      date: d.toISOString().split('T')[0],
      dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
      dayNum: d.getDate(),
      totalDuration,
      tasks: dayTasks
    };
  });

  const totalWeekDuration = weekDays.reduce((acc, day) => acc + day.totalDuration, 0);

  // calculate category stats for chart
  const categoryStats = categories.map(cat => {
    const duration = tasks
      .filter(t => {
        const d = new Date(t.startTime);
        return d >= startOfWeek && d <= endOfWeek;
      })
      .filter(t => t.categoryId === cat.id)
      .reduce((acc, t) => acc + t.duration, 0);
    return { ...cat, duration };
  }).filter(c => c.duration > 0);

  const maxCatDuration = Math.max(...categoryStats.map(c => c.duration), 1);

  return (
    <div className="print-area w-full bg-white text-slate-900 mx-auto shadow-md my-8 transform scale-90 origin-top flex print-layout-row">
      {/* LEFT COLUMN: TIMELINE AXIS */}
      <div className="w-10 flex-shrink-0 flex flex-col pt-[15mm] border-r border-slate-300">
        <div className="flex-1 relative">
          {hoursMap.map((h, idx) => {
            let topCell = idx < 18 ? idx * 2 : 36 + (idx - 18);
            const topPct = (topCell / 42) * 100;
            const heightPct = idx < 18 ? (2 / 42) * 100 : (1 / 42) * 100;

            return (
              <div key={idx} className="absolute w-full text-right pr-1 border-t border-slate-200"
                style={{ top: `${topPct}%`, height: `${heightPct}%` }}>
                <span className="text-[8px] text-slate-400 font-mono -translate-y-1/2 block leading-none">{h}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* CENTER: DAYS COLUMNS */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-[15mm] flex border-b border-black items-end pb-1 ml-[1px]">
          {weekDays.map(day => (
            <div key={day.date} className="flex-1 text-center">
              <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">{day.dayName}</div>
              <div className="font-bold text-base leading-none">{day.dayNum}</div>
            </div>
          ))}
        </div>

        {/* Grid Content */}
        <div className="flex-1 flex relative">
          {/* EXPLICIT GRID BACKGROUND */}
          <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
            {/* Rows: 42 of them */}
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={`row-${i}`} className="flex-1 border-b border-slate-100 w-full box-border"></div>
            ))}
          </div>
          <div className="absolute inset-0 flex pointer-events-none z-0">
            {/* Cols: 7 of them */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`col-${i}`} className="flex-1 border-r border-slate-100 h-full box-border"></div>
            ))}
          </div>

          {/* Day Columns & Tasks */}
          {weekDays.map(day => (
            <div key={day.date} className="flex-1 border-r border-slate-200 relative h-full z-10" style={{ boxSizing: 'border-box' }}>
              {day.tasks.map(t => {
                const pos = getTopAndHeight(new Date(t.startTime), t.duration);
                const cat = categories.find(c => c.id === t.categoryId) || { color: '#ccc' };

                return (
                  <div key={t.id}
                    className="absolute left-0.5 right-0.5 rounded-[1px] overflow-hidden flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.1)] print:shadow-none select-none border border-white/20 print:border-black/10"
                    style={{
                      top: pos.top,
                      height: pos.height,
                      backgroundColor: cat.color,
                      zIndex: 10
                    }}
                  >
                    <span className="text-white text-[8px] print:text-[6px] font-bold leading-none tracking-tight mix-blend-plus-lighter print:hidden"
                      style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'upright',
                        maxHeight: '95%'
                      }}>
                      {t.name}
                    </span>
                    {/* Print Optimized Text */}
                    <span className="hidden print:block text-white print:text-[6px] font-bold leading-none text-center transform scale-90"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                      {t.name.slice(0, 4)}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: VIZ & STATS */}
      <div className="w-[50mm] flex-shrink-0 border-l border-slate-300 flex flex-col p-3 bg-slate-50 print:bg-white">
        <div className="mb-4">
          <h2 className="font-bold text-2xl">{startOfWeek.getFullYear()}</h2>
          <div className="text-[10px] text-slate-500 mt-1">{startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}</div>
        </div>

        {/* VISUAL STATS (Bar Chart) */}
        <div className="mb-6">
          <h3 className="font-bold text-xs border-b border-black mb-3 pb-1 flex justify-between">
            <span>STATS</span>
            <span className="font-mono">{formatDuration(totalWeekDuration)}</span>
          </h3>
          <div className="space-y-2">
            {categoryStats.map(cat => {
              const pct = (cat.duration / maxCatDuration) * 100;
              return (
                <div key={cat.id} className="flex items-center gap-2 text-[10px]">
                  <div className="w-12 text-right truncate text-slate-500">{cat.name}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full rounded-sm min-w-[2px]"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}></div>
                  </div>
                  <div className="w-10 font-mono text-right opacity-70">{formatDuration(cat.duration)}</div>
                </div>
              )
            })}
            {categoryStats.length === 0 && <div className="text-[10px] text-slate-400 italic">No data yet</div>}
          </div>
        </div>

        {/* CUSTOMIZABLE MEMO */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-bold text-xs border-b border-black mb-2 pb-1">MEMO / ANALYSIS</h3>
          <div
            className="flex-1 bg-white border border-slate-200 rounded p-2 text-[10px] leading-relaxed outline-none focus:ring-1 focus:ring-slate-300 text-slate-600 resize-none whitespace-pre-wrap font-sans grid-pattern-4mm"
            contentEditable
            suppressContentEditableWarning
          >
            Notes...
          </div>
        </div>

        {/* 4mm Grid Ref */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-end">
          <div className="text-[8px] text-slate-300">4mm Grid Ref</div>
          <div className="w-8 h-8 border border-slate-300 grid-pattern-4mm"></div>
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

  useEffect(() => {
    if (currentTask) {
      const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(currentTask.startTime).getTime()) / 1000)));
      calc(); timerRef.current = setInterval(calc, 1000);
    } else { clearInterval(timerRef.current); setElapsed(0); }
    return () => clearInterval(timerRef.current);
  }, [currentTask]);

  useEffect(() => {
    if (currentSubTask) {
      const calc = () => setSubElapsed(Math.max(0, Math.floor((Date.now() - new Date(currentSubTask.startTime).getTime()) / 1000)));
      calc(); subTimerRef.current = setInterval(calc, 1000);
    } else { clearInterval(subTimerRef.current); setSubElapsed(0); }
    return () => clearInterval(subTimerRef.current);
  }, [currentSubTask]);

  const startTimer = () => { if (!taskName.trim()) return; setCurrentTask({ id: generateId(), name: taskName, startTime: new Date().toISOString(), duration: 0, categoryId: selectedCategoryId }); };
  const stopTimer = () => { if (!currentTask) return; setTasks([{ ...currentTask, endTime: new Date().toISOString(), duration: elapsed, date: new Date().toISOString().split('T')[0] }, ...tasks]); setCurrentTask(null); setTaskName(''); setElapsed(0); };
  const startSubTimer = () => { if (!subTaskName.trim()) return; setCurrentSubTask({ id: generateId(), name: subTaskName, startTime: new Date().toISOString(), duration: 0, categoryId: (categories.find(c => c.id === 'sub') || categories[0]).id }); };
  const stopSubTimer = () => { if (!currentSubTask) return; setTasks([{ ...currentSubTask, endTime: new Date().toISOString(), duration: subElapsed, date: new Date().toISOString().split('T')[0] }, ...tasks]); setCurrentSubTask(null); setSubTaskName(''); setSubElapsed(0); };
  const deleteTask = (id) => { if (confirm('Del?')) setTasks(tasks.filter(t => t.id !== id)); };

  const togglePiP = async () => {
    if (pipWindowRef.current) { pipWindowRef.current.close(); return; }
    if (!window.documentPictureInPicture) { setIsMiniMode(!isMiniMode); return; }
    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 300, height: 400 });
      pipWindowRef.current = pipWindow;
      setIsMiniMode(true);
      Array.from(document.styleSheets).forEach(s => {
        try {
          if (s.href) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = s.href; pipWindow.document.head.appendChild(l); }
          else if (s.cssRules) { const st = document.createElement('style'); st.textContent = [...s.cssRules].map(r => r.cssText).join(''); pipWindow.document.head.appendChild(st); }
        } catch (e) { }
      });
      const c = document.getElementById('unified-timer-container');
      if (c) pipWindow.document.body.appendChild(c);
      pipWindow.addEventListener('pagehide', () => {
        const r = document.getElementById('unified-timer-root');
        if (r && c) r.appendChild(c);
        pipWindowRef.current = null;
        setIsMiniMode(false);
      });
    } catch (e) { console.error(e); alert("PiP Error"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 transition-colors pb-20">
      <PrintStyles />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} setCategories={setCategories} resetCategories={() => setCategories(DEFAULT_CATEGORIES)} />

      {/* NO PRINT HEADER */}
      <div className="no-print pt-6 px-6 mb-4 flex justify-between items-center max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TimeFlow Weeks</h1>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm" onClick={() => window.print()}><Printer size={20} className="text-slate-600 dark:text-slate-300" /></button>
          <button className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm" onClick={() => setIsCategoryModalOpen(true)}><Settings size={20} className="text-slate-600 dark:text-slate-300" /></button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-xl relative no-print">
        <div id="unified-timer-root">
          <div id="unified-timer-container">
            <TimerContainer
              currentTask={currentTask} taskName={taskName} setTaskName={setTaskName} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} categories={categories} startTimer={startTimer} stopTimer={stopTimer} elapsed={elapsed}
              currentSubTask={currentSubTask} subTaskName={subTaskName} setSubTaskName={setSubTaskName} startSubTimer={startSubTimer} stopSubTimer={stopSubTimer} subElapsed={subElapsed}
              isMiniMode={isMiniMode} togglePiP={togglePiP} onOpenSettings={() => setIsCategoryModalOpen(true)}
            />
          </div>
        </div>

        {/* Task List (No Print) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-8">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().split('T')[0]) }}><ChevronLeft /></button>
            <div className="font-bold flex gap-2 items-center"><Calendar size={18} /> {viewDate}</div>
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().split('T')[0]) }}><ChevronRight /></button>
          </div>
          <div className="space-y-2">
            {tasks.filter(t => t.date === viewDate).length === 0 && <div className="text-center text-slate-400 py-4">No tasks</div>}
            {tasks.filter(t => t.date === viewDate).map(t => (
              <div key={t.id} className="flex justify-between p-3 hover:bg-slate-50 border rounded-xl border-transparent hover:border-slate-100">
                <div className="flex gap-3 items-center">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: (categories.find(c => c.id === t.categoryId) || {}).color }}></div>
                  <div><div className="font-bold">{t.name}</div><div className="text-xs text-slate-400">{formatTime(new Date(t.startTime))}</div></div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="font-mono font-bold">{formatDuration(t.duration)}</div>
                  <button onClick={() => deleteTask(t.id)}><Trash2 size={16} className="text-slate-300 hover:text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TIMELINE (PRINT ROOT) */}
      <div id="print-root">
        <div className="container mx-auto px-4 max-w-4xl pb-10">
          <h2 className="text-xl font-bold mb-4 px-4 text-slate-500 no-print">Weekly Overview</h2>
          <WeeksLayout viewDate={viewDate} tasks={tasks} categories={categories} />
        </div>
      </div>
    </div>
  );
}
