import React, { useState, useEffect, useRef, useMemo } from 'react';
import PhotoPrinter from './PhotoPrinter';
import { createPortal } from 'react-dom';
import {
  Play, Square, Maximize2, Minimize2, Printer, Trash2,
  Clock, ChevronRight, ChevronLeft, CheckCircle, Plus,
  Edit2, X, Save, Settings, RotateCcw, Zap, Eye, EyeOff, Moon, Sun,
  BarChart2, PieChart, Calendar, PictureInPicture2, Move, Image as ImageIcon
} from 'lucide-react';

// --- 1. Styles & Constants ---

const PrintStyles = () => (
  <style>{`
    @media print {
      @page {
        size: A4 portrait; 
        margin: 10mm;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: white !important;
      }
      .no-print {
        display: none !important;
      }
      .print-area {
        display: flex !important;
        flex-direction: row !important;
        gap: 10mm !important;
        width: auto !important; 
        height: auto;
        overflow: visible;
        box-shadow: none !important;
        border: none !important;
        background: transparent !important;
        margin: 0 auto;
      }
      .print-chart-container {
        background: white;
        box-shadow: none !important;
        border: 1px solid #eee; 
      }
    }
    
    .grid-pattern-4mm {
      background-size: 4mm 4mm;
      background-image:
        linear-gradient(to right, rgba(150, 150, 150, 0.3) 0.25px, transparent 0.25px),
        linear-gradient(to bottom, rgba(150, 150, 150, 0.3) 0.25px, transparent 0.25px);
    }
    .grid-pattern-4mm-dotted {
       background-size: 4mm 4mm;
       background-image: radial-gradient(circle, rgba(150, 150, 150, 0.5) 0.5px, transparent 0.5px);
    }
    .horizontal-lines-4mm {
      background-image: repeating-linear-gradient(to bottom, 
        rgba(150, 150, 150, 0.5) 0, 
        rgba(150, 150, 150, 0.5) 0.25px, 
        transparent 0.25px, 
        transparent 4mm
      );
    }
    .vertical-line-thin {
      border-right-width: 0.25px !important;
      border-right-style: solid !important;
      border-color: rgba(200, 200, 200, 0.8) !important;
    }
    .vertical-line-dotted {
      border-right-width: 0.25px !important;
      border-right-style: dotted !important;
      border-color: rgba(200, 200, 200, 0.8) !important;
    }
  `}</style>
);

const COLOR_PALETTES = {
  '莫兰迪粉': ['#EAB8B8', '#F1D1D0', '#E2979C', '#CDB0B0', '#D6BCC0', '#E5C1CD', '#F4EBEB'],
  '复古绿': ['#8FBC8F', '#A3C1AD', '#556B2F', '#6B8E23', '#CADFCD', '#4F7942', '#D0E0D0'],
  '静谧蓝': ['#B0C4DE', '#ADD8E6', '#87CEFA', '#4682B4', '#5F9EA0', '#778899', '#E0FFFF'],
  '大地色': ['#D2B48C', '#BC8F8F', '#F4A460', '#DEB887', '#CD853F', '#A0522D', '#FFF5EE'],
  '高饱和': ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#6366f1']
};

const DEFAULT_CATEGORIES = [
  { id: 'work', name: '工作', color: '#3b82f6' },
  { id: 'study', name: '学习', color: '#10b981' },
  { id: 'life', name: '生活', color: '#f59e0b' },
  { id: 'rest', name: '休息', color: '#8b5cf6' },
  { id: 'sport', name: '运动', color: '#ef4444' },
  { id: 'other', name: '其他', color: '#64748b' },
  { id: 'sub', name: '并行/副', color: '#a8a29e' },
];

const HOURS_DAY_PART = 18;
const HOURS_NIGHT_PART = 6;
const HOUR_HEIGHT_DAY = 8;
const HOUR_HEIGHT_NIGHT = 4;
const HEIGHT_DAY_MM = HOURS_DAY_PART * HOUR_HEIGHT_DAY;
const HEIGHT_NIGHT_MM = HOURS_NIGHT_PART * HOUR_HEIGHT_NIGHT;
const TOTAL_HEIGHT_MM = HEIGHT_DAY_MM + HEIGHT_NIGHT_MM;

// --- 2. Utilities ---

const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDuration = (seconds) => {
  if (isNaN(seconds)) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatTime = (dateObj) => {
  return dateObj.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

const formatFullTime = (dateObj) => {
  return dateObj.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const getStartOfWeek = (dateStr) => {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const getCategory = (categories, id) => categories.find(c => c.id === id) || { name: '未知', color: '#cbd5e1' };

const splitTasksAcrossDays = (taskList) => {
  const segments = [];
  taskList.forEach(task => {
    const startTime = new Date(task.startTime);
    const endTime = new Date(task.endTime);
    let currentSegmentStart = new Date(startTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || startTime >= endTime) return;

    while (currentSegmentStart < endTime) {
      let logicalDayStart = new Date(currentSegmentStart);
      if (logicalDayStart.getHours() < 7) {
        logicalDayStart.setDate(logicalDayStart.getDate() - 1);
      }
      logicalDayStart.setHours(7, 0, 0, 0);

      let logicalDayEnd = new Date(logicalDayStart);
      logicalDayEnd.setDate(logicalDayEnd.getDate() + 1); // Next day 07:00

      let currentSegmentEnd = new Date(Math.min(endTime.getTime(), logicalDayEnd.getTime()));

      // Force segment end to match 7AM boundary if crossing it (though usually safe within split logic)
      if (currentSegmentEnd > currentSegmentStart) {
        segments.push({
          ...task,
          id: `${task.id}_${currentSegmentStart.getTime()}`,
          startTime: currentSegmentStart.toISOString(),
          endTime: currentSegmentEnd.toISOString(),
          duration: (currentSegmentEnd - currentSegmentStart) / 1000,
          date: toLocalDateString(logicalDayStart)
        });
      }
      if (currentSegmentEnd.getTime() <= currentSegmentStart.getTime()) break;
      currentSegmentStart = currentSegmentEnd;
    }
  });
  return segments;
};

const calculateTopHeight = (task) => {
  const start = new Date(task.startTime);
  let h = start.getHours();
  const m = start.getMinutes();
  const adjustedH = h < 7 ? h + 24 : h;
  const startHourMetric = (adjustedH - 7) + (m / 60); // 0.0 to 24.0

  let topMM = 0;
  // Calculate Top Position
  if (startHourMetric < HOURS_DAY_PART) {
    topMM = startHourMetric * HOUR_HEIGHT_DAY;
  } else {
    topMM = HEIGHT_DAY_MM + (startHourMetric - HOURS_DAY_PART) * HOUR_HEIGHT_NIGHT;
  }

  // Calculate Height (Integral)
  const durationHours = task.duration / 3600;
  const endHourMetric = startHourMetric + durationHours;

  let heightMM = 0;

  // Case 1: Entirely within Day Part (e.g. 08:00 - 12:00)
  if (endHourMetric <= HOURS_DAY_PART) {
    heightMM = durationHours * HOUR_HEIGHT_DAY;
  }
  // Case 2: Entirely within Night Part (e.g. 02:00 - 04:00)
  else if (startHourMetric >= HOURS_DAY_PART) {
    heightMM = durationHours * HOUR_HEIGHT_NIGHT;
  }
  // Case 3: Crossing Boundary (e.g. 23:00 - 02:00 / 16h - 19h metric)
  else {
    const dayDuration = HOURS_DAY_PART - startHourMetric;
    const nightDuration = endHourMetric - HOURS_DAY_PART;
    heightMM = (dayDuration * HOUR_HEIGHT_DAY) + (nightDuration * HOUR_HEIGHT_NIGHT);
  }

  return { topMM, heightMM: Math.max(heightMM, 1) };
};

const getTaskLayout = (dayTasks) => {
  const placedTasks = [];
  dayTasks.forEach(task => {
    const { topMM, heightMM } = calculateTopHeight(task);
    const bottomMM = topMM + heightMM;
    const overlaps = placedTasks.filter(p => (topMM < p.topMM + p.heightMM && bottomMM > p.topMM));
    let colIndex = 0;
    if (overlaps.length > 0) {
      const occupiedCols = new Set(overlaps.map(p => p.colIndex));
      if (!occupiedCols.has(0)) colIndex = 0;
      else if (!occupiedCols.has(1)) colIndex = 1;
      else colIndex = 0;
    }
    placedTasks.push({ task, topMM, heightMM, colIndex });
  });
  return placedTasks;
};

const getAdaptiveFontSize = (heightMM, text) => {
  if (!text) return '6px';
  const len = text.length;
  const availablePerChar = heightMM / (len || 1);
  const pxPerChar = availablePerChar * 3.78;
  let size = Math.min(9, Math.max(5, pxPerChar * 0.8));
  return `${size}px`;
};

const getTaskStyle = (layoutItem, categories, isPlan = false) => {
  const { task, topMM, heightMM, colIndex } = layoutItem;
  const catId = task.categoryId || task.category?.id;
  const cat = getCategory(categories, catId);
  const isOffset = colIndex > 0;
  return {
    top: `${topMM}mm`,
    height: `${heightMM}mm`,
    backgroundColor: isPlan ? 'transparent' : cat.color,
    border: isPlan ? `1px dashed ${cat.color}` : 'none',
    position: 'absolute',
    left: isOffset ? '50%' : '0%',
    width: isOffset ? '50%' : '100%',
    borderRadius: '0.5px',
    zIndex: 10 + colIndex,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    writingMode: 'vertical-rl',
    textOrientation: 'upright',
    overflow: 'hidden',
    color: isPlan ? cat.color : '#fff',
    fontSize: getAdaptiveFontSize(heightMM, task.name),
    lineHeight: '1',
    letterSpacing: '-0.5px',
    whiteSpace: 'nowrap',
    opacity: isPlan ? 0.8 : 1
  };
};

const getTasksForDate = (taskList, dateObj) => {
  const targetDateStr = toLocalDateString(dateObj);
  return taskList.filter(t => t.date === targetDateStr).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

// --- 3. UI Components ---

const CategorySelector = ({ categories, selectedId, onSelect, onOpenSettings }) => (
  <div className="flex gap-2 flex-wrap mb-4">
    {categories.map(cat => (
      <button
        key={cat.id}
        onClick={() => onSelect(cat.id)}
        style={{
          borderColor: selectedId === cat.id ? cat.color : 'transparent',
          backgroundColor: selectedId === cat.id ? `${cat.color}20` : 'transparent',
          color: selectedId === cat.id ? cat.color : undefined
        }}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5
          ${selectedId !== cat.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700' : ''}`}
      >
        <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></span>
        {cat.name}
      </button>
    ))}
    <button
      onClick={onOpenSettings}
      className="px-2 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors"
    >
      <Settings size={14} />
    </button>
  </div>
);

const StatsInterface = ({ tasks, categories, weekStartStr, weekEndStr }) => {
  const stats = useMemo(() => {
    const categoryStats = {};
    let totalDuration = 0;

    tasks.forEach(task => {
      if (task.date >= weekStartStr && task.date <= weekEndStr) {
        const catId = task.categoryId || task.category?.id;
        if (!categoryStats[catId]) categoryStats[catId] = 0;
        categoryStats[catId] += task.duration;
        totalDuration += task.duration;
      }
    });

    const data = Object.keys(categoryStats).map(catId => {
      const cat = getCategory(categories, catId);
      return {
        id: catId,
        name: cat.name,
        color: cat.color,
        value: categoryStats[catId],
        percentage: totalDuration > 0 ? (categoryStats[catId] / totalDuration) * 100 : 0
      };
    }).sort((a, b) => b.value - a.value);

    return { data, totalDuration };
  }, [tasks, categories, weekStartStr, weekEndStr]);

  if (stats.data.length === 0) return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/20 dark:border-slate-700/50 shadow-xl rounded-3xl p-6 h-full flex flex-col items-center justify-center text-slate-400">
      <BarChart2 size={32} className="mb-2 opacity-50" />
      <span className="text-sm">本周暂无数据</span>
    </div>
  );

  let cumulativePercent = 0;
  const pieSlices = stats.data.map((item, i) => {
    const startPercent = cumulativePercent;
    const endPercent = cumulativePercent + item.percentage;
    cumulativePercent = endPercent;

    const x1 = Math.cos(2 * Math.PI * (startPercent / 100));
    const y1 = Math.sin(2 * Math.PI * (startPercent / 100));
    const x2 = Math.cos(2 * Math.PI * (endPercent / 100));
    const y2 = Math.sin(2 * Math.PI * (endPercent / 100));

    const largeArcFlag = item.percentage > 50 ? 1 : 0;

    const pathData = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');

    return (
      <path key={item.id} d={pathData} fill={item.color} className="hover:opacity-80 transition-opacity cursor-pointer" title={`${item.name}: ${Math.round(item.percentage)}%`}>
        <title>{`${item.name}: ${formatDuration(item.value)}`}</title>
      </path>
    );
  });

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/20 dark:border-slate-700/50 shadow-xl rounded-3xl p-6 h-full flex flex-col no-print w-full">
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
        <PieChart size={18} className="text-indigo-500" /> 本周时间分布
      </h3>

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-center relative h-40">
          {stats.data.length === 1 ? (
            <div className="w-32 h-32 rounded-full" style={{ backgroundColor: stats.data[0].color }}></div>
          ) : (
            <svg viewBox="-1 -1 2 2" className="w-32 h-32 transform -rotate-90">
              {pieSlices}
            </svg>
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full px-2 py-1 shadow-sm">
              <div className="text-[10px] text-slate-400 font-bold">TOTAL</div>
              <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                {formatDuration(stats.totalDuration).split(' ')[0]}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[300px] custom-scrollbar">
          {stats.data.map(item => (
            <div key={item.id} className="group">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-mono text-slate-500">{formatDuration(item.value)}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StandardStrip = ({ weekDates, processedTasks, categories }) => {
  return (
    <div className="print-chart-container bg-white text-black relative flex flex-col items-center" style={{ width: '38mm', minHeight: '180mm' }}>
      <div className="flex w-full pl-[10mm] mb-1">
        {weekDates.map((dateObj, i) => {
          const isToday = toLocalDateString(dateObj) === toLocalDateString(new Date());
          const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()];
          return (
            <div key={i} className="flex-1 text-center flex flex-col justify-end" style={{ width: '4mm', height: '8mm' }}>
              <div className="text-[6px] font-bold text-gray-400 leading-none">{dayLabel}</div>
              <div className={`text-[7px] font-mono leading-tight ${isToday ? 'font-bold text-black' : 'text-gray-600'}`}>
                {dateObj.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex relative w-full border-t border-gray-800">
        <div className="w-[10mm] relative border-r border-gray-300 flex-shrink-0 text-[6px] text-gray-400 font-mono text-right pr-1">
          {Array.from({ length: HOURS_DAY_PART }).map((_, i) => (
            <div key={`d-${i}`} className="absolute w-full pt-[1px]" style={{ top: `${i * HOUR_HEIGHT_DAY}mm`, height: '0px' }}>{(7 + i) % 24 || 24}</div>
          ))}
          <div className="absolute w-full pt-[1px] font-bold text-black" style={{ top: `${HEIGHT_DAY_MM}mm`, height: '0px' }}>1</div>
          {Array.from({ length: HOURS_NIGHT_PART }).map((_, i) => i > 0 && (
            <div key={`n-${i}`} className="absolute w-full pt-[1px]" style={{ top: `${HEIGHT_DAY_MM + i * HOUR_HEIGHT_NIGHT}mm`, height: '0px' }}>{1 + i}</div>
          ))}
        </div>
        <div className="flex relative horizontal-lines-4mm" style={{ width: '28mm', height: `${TOTAL_HEIGHT_MM}mm` }}>
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Only vertical lines needed now */}
            <div className="absolute w-full border-b-[0.25px] border-gray-400" style={{ top: `${HEIGHT_DAY_MM}mm` }}></div>
            {weekDates.map((_, i) => (
              <div key={`vl-${i}`} className="absolute h-full vertical-line-thin" style={{ left: `${(i + 1) * 4}mm` }}></div>
            ))}
          </div>
          {weekDates.map((dateObj, i) => {
            const dayTasks = getTasksForDate(processedTasks, dateObj);
            const layout = getTaskLayout(dayTasks);
            return (
              <div key={i} className="relative h-full" style={{ width: '4mm' }}>
                {layout.map((item) => (
                  <div key={item.task.id} style={getTaskStyle(item, categories)} title={`${item.task.name}`}>
                    <span style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>{String(item.task.name).slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-full pl-[10mm] mt-1 text-[6px] text-gray-300 font-mono text-center">Actuals Only (38mm)</div>
    </div>
  );
};

const PlanActualStrip = ({ weekDates, processedTasks, processedPlans, categories }) => {
  return (
    <div className="print-chart-container bg-white text-black relative flex flex-col items-center" style={{ width: '66mm', minHeight: '180mm' }}>
      <div className="flex w-full pl-[10mm] mb-1">
        {weekDates.map((dateObj, i) => {
          const isToday = toLocalDateString(dateObj) === toLocalDateString(new Date());
          const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()];
          return (
            <div key={i} className="flex-1 text-center flex flex-col justify-end" style={{ width: '8mm', height: '8mm' }}>
              <div className="text-[6px] font-bold text-gray-400 leading-none">{dayLabel}</div>
              <div className={`text-[7px] font-mono leading-tight ${isToday ? 'font-bold text-black' : 'text-gray-600'}`}>
                {dateObj.getDate()}
              </div>
              <div className="flex justify-between px-[1mm] mt-[1px]">
                <span className="text-[4px] text-gray-300">P</span>
                <span className="text-[4px] text-gray-300">A</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex relative w-full border-t border-gray-800">
        <div className="w-[10mm] relative border-r border-gray-300 flex-shrink-0 text-[6px] text-gray-400 font-mono text-right pr-1">
          {Array.from({ length: HOURS_DAY_PART }).map((_, i) => (
            <div key={`d-${i}`} className="absolute w-full pt-[1px]" style={{ top: `${i * HOUR_HEIGHT_DAY}mm`, height: '0px' }}>{(7 + i) % 24 || 24}</div>
          ))}
          <div className="absolute w-full pt-[1px] font-bold text-black" style={{ top: `${HEIGHT_DAY_MM}mm`, height: '0px' }}>1</div>
          {Array.from({ length: HOURS_NIGHT_PART }).map((_, i) => i > 0 && (
            <div key={`n-${i}`} className="absolute w-full pt-[1px]" style={{ top: `${HEIGHT_DAY_MM + i * HOUR_HEIGHT_NIGHT}mm`, height: '0px' }}>{1 + i}</div>
          ))}
        </div>
        <div className="flex relative horizontal-lines-4mm" style={{ width: '56mm', height: `${TOTAL_HEIGHT_MM}mm` }}>
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Vertical Lines */}
            <div className="absolute w-full border-b-[0.25px] border-gray-400" style={{ top: `${HEIGHT_DAY_MM}mm` }}></div>
            {weekDates.map((_, i) => (
              <div key={`vl-${i}`} className="absolute h-full vertical-line-thin" style={{ left: `${(i + 1) * 8}mm` }}></div>
            ))}
            {weekDates.map((_, i) => (
              <div key={`vld-${i}`} className="absolute h-full vertical-line-dotted" style={{ left: `${i * 8 + 4}mm` }}></div>
            ))}
          </div>
          {weekDates.map((dateObj, i) => {
            const dayPlans = getTasksForDate(processedPlans, dateObj);
            const planLayout = getTaskLayout(dayPlans);
            const dayActuals = getTasksForDate(processedTasks, dateObj);
            const actualLayout = getTaskLayout(dayActuals);
            return (
              <div key={i} className="flex h-full vertical-line-thin" style={{ width: '8mm' }}>
                <div className="relative h-full vertical-line-dotted" style={{ width: '4mm' }}>
                  {planLayout.map((item) => (
                    <div key={item.task.id} style={getTaskStyle(item, categories, true)} title={`Plan: ${item.task.name}`}>
                      <span style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>{String(item.task.name).slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
                <div className="relative h-full" style={{ width: '4mm' }}>
                  {actualLayout.map((item) => (
                    <div key={item.task.id} style={getTaskStyle(item, categories, false)} title={`Actual: ${item.task.name}`}>
                      <span style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>{String(item.task.name).slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-full pl-[10mm] mt-1 text-[6px] text-gray-300 font-mono text-center">Plan vs Actual (66mm)</div>
    </div>
  );
};

const WeeklyReportInterface = ({ viewDate, setViewDate, tasks, plans, categories, openManualModal }) => {
  const [showStandard, setShowStandard] = useState(true);
  const [showPlanActual, setShowPlanActual] = useState(true);

  const processedTasks = useMemo(() => splitTasksAcrossDays(tasks), [tasks]);
  const processedPlans = useMemo(() => splitTasksAcrossDays(plans), [plans]);

  const startOfWeek = getStartOfWeek(viewDate);
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekStartStr = toLocalDateString(weekDates[0]);
  const weekEndStr = toLocalDateString(weekDates[6]);

  const moveWeek = (offset) => {
    const d = parseLocalDate(viewDate);
    d.setDate(d.getDate() + (offset * 7));
    setViewDate(toLocalDateString(d));
  };

  const glassCard = "bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-black/20";
  const btnSecondary = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-[0.98]";
  const btnPrimary = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/50 transition-all active:scale-[0.98]";

  return (
    <div className="w-full">
      <div className={`no-print w-full flex flex-wrap gap-4 items-center justify-between mb-8 p-6 rounded-3xl ${glassCard}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl p-1">
            <button onClick={() => moveWeek(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg shadow-sm transition-all"><ChevronLeft size={16} /></button>
            <span className="px-3 text-sm font-mono font-medium text-slate-600 dark:text-slate-300">{weekStartStr} ~ {weekEndStr}</span>
            <button onClick={() => moveWeek(1)} className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg shadow-sm transition-all"><ChevronRight size={16} /></button>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-600/50 pl-4 ml-2">
            <button onClick={() => setShowStandard(!showStandard)} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${showStandard ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              {showStandard ? <Eye size={14} /> : <EyeOff size={14} />} 极简版
            </button>
            <button onClick={() => setShowPlanActual(!showPlanActual)} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${showPlanActual ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              {showPlanActual ? <Eye size={14} /> : <EyeOff size={14} />} 计划实绩版
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={openManualModal} className={`${btnSecondary} flex items-center gap-2 px-4 py-2 rounded-xl text-sm`}><Plus size={16} /> 补登/计划</button>
          <button onClick={() => window.print()} className={`${btnPrimary} flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold`}><Printer size={16} /> 打印</button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        <div className="print-area flex justify-center flex-1">
          <PrintStyles />
          {showStandard && <StandardStrip weekDates={weekDates} processedTasks={processedTasks} categories={categories} />}
          {showPlanActual && <div className="ml-8"><PlanActualStrip weekDates={weekDates} processedTasks={processedTasks} processedPlans={processedPlans} categories={categories} /></div>}
        </div>
      </div>

      <div className="no-print w-full text-center text-sm text-gray-400 mt-4 pb-12">
        打印提示：建议使用 "A4", "无边距", "缩放100%"。左侧为精简版，右侧为 PDCA 详细版。
        <div className="text-[10px] opacity-50 mt-1">v6.1 Build: 2026-02-03 14:10</div>
      </div>
    </div>
  );
};

const TimerInterface = ({
  isMiniMode, setIsMiniMode, isDarkMode, setIsDarkMode, currentTime, elapsed,
  currentTask, taskName, setTaskName, startTimer, stopTimer, adjustStartTime,
  categories, selectedCategoryId, setSelectedCategoryId, openManualModal, setIsCategoryModalOpen,
  subElapsed, currentSubTask, subTaskName, setSubTaskName, startSubTimer, stopSubTimer,
  togglePiP, isPiPActive
}) => {
  const currentCat = currentTask ? getCategory(categories, currentTask.categoryId) : null;
  const glassCard = "bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-black/20";
  const inputStyle = "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl";
  const btnPrimary = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/50 transition-all active:scale-[0.98]";
  const btnSecondary = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-[0.98]";

  // Dragging logic for in-page mini mode
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Set initial position based on window size if mini mode starts
    if (isMiniMode && !isPiPActive) {
      setPosition({ x: window.innerWidth - 360, y: window.innerHeight - 500 });
    }
  }, [isMiniMode, isPiPActive]);

  const handlePointerDown = (e) => {
    if (!isMiniMode || isPiPActive) return;
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y
      });
    };
    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const miniModeStyle = isMiniMode && !isPiPActive ? {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: '340px',
    zIndex: 50,
    cursor: isDragging ? 'grabbing' : 'auto'
  } : {};

  return (
    <div
      ref={dragRef}
      onPointerDown={handlePointerDown}
      style={miniModeStyle}
      className={`transition-shadow duration-300 ease-out flex flex-col ${glassCard} overflow-hidden h-fit 
        ${!isMiniMode && !isPiPActive ? 'relative w-full rounded-3xl' : 'rounded-2xl shadow-2xl'} 
        ${isPiPActive ? 'h-screen w-screen rounded-none' : ''}
        no-print`}
    >

      {/* Header */}
      <div className={`flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 ${isMiniMode || isPiPActive ? 'p-3 bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing' : 'p-6'}`}>
        <div className="flex items-center gap-3">
          {isMiniMode && !isPiPActive && <Move size={14} className="text-slate-400 mr-1" />}
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">TimeFlow</div>
            <div className="font-mono text-xl font-bold text-slate-800 dark:text-white leading-none tracking-tight">
              {formatFullTime(currentTime)}
            </div>
          </div>
        </div>
        <div className="flex gap-2" onPointerDown={e => e.stopPropagation()}>
          {!isPiPActive && window.documentPictureInPicture && (
            <button
              onClick={togglePiP}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
              title="独立悬浮窗 (Always on Top)"
            >
              <PictureInPicture2 size={18} />
            </button>
          )}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {!isPiPActive && (
            <button onClick={() => setIsMiniMode(!isMiniMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
              {isMiniMode ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 relative ${isMiniMode || isPiPActive ? 'p-5' : 'p-8 pb-10'}`}>
        <div className="text-center mb-8 relative group">
          <div className={`font-mono font-bold text-slate-800 dark:text-white transition-all duration-300 ${isMiniMode || isPiPActive ? 'text-6xl' : 'text-8xl tracking-tighter'}`}>
            {formatDuration(elapsed).replace('h ', ':').replace('m', '')}
            <span className={`text-sm font-medium text-slate-400 ml-2 ${isMiniMode || isPiPActive ? 'block mt-[-5px]' : ''}`}>
              {elapsed < 3600 ? 'mm:ss' : 'hh:mm'}
            </span>
          </div>
          {currentTask && (
            <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl">
              <button onClick={() => adjustStartTime(5)} className="px-3 py-1 bg-white dark:bg-slate-800 shadow-md rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform">-5m</button>
              <button onClick={() => adjustStartTime(-5)} className="px-3 py-1 bg-white dark:bg-slate-800 shadow-md rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform">+5m</button>
            </div>
          )}
          {currentTask && (
            <div className="flex items-center justify-center gap-2 mt-4 animate-fade-in">
              <div className="h-1.5 w-1.5 rounded-full animate-ping" style={{ backgroundColor: currentCat.color }}></div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {currentTask.name}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {!currentTask ? (
            <div className="animate-fade-in-up">
              <CategorySelector
                categories={categories}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                onOpenSettings={() => setIsCategoryModalOpen(true)}
              />
              <div className="flex gap-3 mt-4">
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="主任务..."
                  className={`flex-1 px-5 py-4 text-lg ${inputStyle}`}
                  onKeyDown={(e) => e.key === 'Enter' && startTimer()}
                />
                <button onClick={openManualModal} className={`${btnSecondary} px-4 rounded-xl`} title="补登">
                  <Edit2 size={20} />
                </button>
              </div>
              <button onClick={startTimer} disabled={!taskName.trim()} className={`w-full mt-4 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${btnPrimary} disabled:opacity-50`}>
                <Play size={20} fill="currentColor" /> 开始专注
              </button>
            </div>
          ) : (
            <button onClick={stopTimer} className="w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition-all active:scale-[0.98]">
              <Square size={20} fill="currentColor" /> 完成主任务
            </button>
          )}
        </div>
      </div>

      {/* Sub Task Panel */}
      <div className="bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Zap size={14} className={currentSubTask ? "text-amber-500 fill-amber-500" : ""} />
            副任务
          </div>
          {currentSubTask && <div className="text-xs font-mono text-slate-400">进行中...</div>}
        </div>
        <div className="flex items-center gap-5">
          <div className={`font-mono font-bold ${currentSubTask ? 'text-slate-800 dark:text-white' : 'text-slate-300 dark:text-slate-600'} text-3xl min-w-[90px] text-center`}>
            {formatDuration(subElapsed).replace('h ', ':').replace('m', '')}
          </div>
          <div className="flex-1">
            {!currentSubTask ? (
              <div className="flex gap-2">
                <input type="text" value={subTaskName} onChange={(e) => setSubTaskName(e.target.value)} placeholder="并行任务..." className={`flex-1 px-4 py-2.5 text-sm ${inputStyle}`} onKeyDown={(e) => e.key === 'Enter' && startSubTimer()} />
                <button onClick={startSubTimer} className={`${btnSecondary} px-4 rounded-xl font-bold`}><Play size={16} fill="currentColor" /></button>
              </div>
            ) : (
              <div className="flex gap-3 items-center bg-white dark:bg-slate-800 p-2 pr-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200 truncate pl-2">{currentSubTask.name}</div>
                <button onClick={stopSubTimer} className="px-4 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 rounded-lg text-xs font-bold flex items-center gap-1"><Square size={12} fill="currentColor" /> 结束</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryManagerModal = ({ isCategoryModalOpen, setIsCategoryModalOpen, categories, applyColorPalette, updateCategory, removeCategory, addCategory, resetCategories }) => {
  if (!isCategoryModalOpen) return null;

  const applyPalette = (paletteName) => {
    const colors = COLOR_PALETTES[paletteName];
    if (!colors) return;
    categories.forEach((cat, index) => {
      if (colors[index % colors.length]) {
        updateCategory(cat.id, 'color', colors[index % colors.length]);
      }
    });
  };

  const inputStyle = "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl";

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-slate-100 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings size={18} /> 分类管理
          </h3>
          <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="px-4 pt-4">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">快捷配色方案 (点击应用)</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(COLOR_PALETTES).map(name => (
              <button
                key={name}
                onClick={() => applyPalette(name)}
                className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-3">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <input type="color" value={cat.color} onChange={(e) => updateCategory(cat.id, 'color', e.target.value)} className="w-8 h-8 p-0 border-0 rounded-lg cursor-pointer flex-shrink-0 bg-transparent" />
                <input type="text" value={cat.name} onChange={(e) => updateCategory(cat.id, 'name', e.target.value)} className={`flex-1 px-3 py-2 text-sm ${inputStyle}`} />
                <button onClick={() => removeCategory(cat.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <button onClick={addCategory} className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors"><Plus size={16} /> 添加新分类</button>
            <button onClick={resetCategories} className="px-3 py-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"><RotateCcw size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManualEntryModal = ({ isManualModalOpen, setIsManualModalOpen, manualForm, setManualForm, saveManualEntry, categories }) => {
  if (!isManualModalOpen) return null;
  const inputStyle = "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl";
  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-slate-100 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Edit2 size={18} /> 补登 / 计划
          </h3>
          <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl mb-4">
            <button onClick={() => setManualForm({ ...manualForm, type: 'actual' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${manualForm.type === 'actual' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>实绩记录 (Actual)</button>
            <button onClick={() => setManualForm({ ...manualForm, type: 'plan' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${manualForm.type === 'plan' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}>计划预定 (Plan)</button>
          </div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">日期</label><input type="date" value={manualForm.date} onChange={e => setManualForm({ ...manualForm, date: e.target.value })} className={`w-full p-2.5 ${inputStyle}`} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">开始时间</label><input type="time" value={manualForm.startTime} onChange={e => setManualForm({ ...manualForm, startTime: e.target.value })} className={`w-full p-2.5 ${inputStyle}`} /></div>
            <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">结束时间</label><input type="time" value={manualForm.endTime} onChange={e => setManualForm({ ...manualForm, endTime: e.target.value })} className={`w-full p-2.5 ${inputStyle}`} /></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">分类</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setManualForm({ ...manualForm, categoryId: cat.id })} style={{ borderColor: manualForm.categoryId === cat.id ? cat.color : 'transparent', backgroundColor: manualForm.categoryId === cat.id ? `${cat.color}20` : 'transparent', color: manualForm.categoryId === cat.id ? cat.color : '#64748b' }} className={`px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${manualForm.categoryId !== cat.id ? 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700' : ''}`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">任务名称</label><input type="text" value={manualForm.name} onChange={e => setManualForm({ ...manualForm, name: e.target.value })} placeholder="做了什么？" className={`w-full p-3 ${inputStyle}`} /></div>
          <button onClick={saveManualEntry} className={`w-full py-3 text-white rounded-xl font-bold mt-4 flex justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] ${manualForm.type === 'plan' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}><Save size={18} /> {manualForm.type === 'plan' ? '保存计划' : '保存实绩'}</button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [tasks, setTasks] = useState([]);
  const [plans, setPlans] = useState([]);

  const [currentTask, setCurrentTask] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORIES[0].id);

  const [currentSubTask, setCurrentSubTask] = useState(null);
  const [subTaskName, setSubTaskName] = useState('');
  const [subElapsed, setSubElapsed] = useState(0);

  const [isMiniMode, setIsMiniMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'printer'
  const [elapsed, setElapsed] = useState(0);
  const [viewDate, setViewDate] = useState(toLocalDateString(new Date()));
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // PiP State
  const [pipWindow, setPipWindow] = useState(null);

  const [manualForm, setManualForm] = useState({
    name: '',
    date: toLocalDateString(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    categoryId: DEFAULT_CATEGORIES[0].id,
    type: 'actual'
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  const timerRef = useRef(null);
  const subTimerRef = useRef(null);

  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      if (pipWindow) pipWindow.document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (pipWindow) pipWindow.document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, pipWindow]);

  // Load Data
  useEffect(() => {
    const savedCategories = localStorage.getItem('timeflow_categories');
    if (savedCategories) setCategories(JSON.parse(savedCategories));

    const savedTasks = localStorage.getItem('timeflow_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedPlans = localStorage.getItem('timeflow_plans');
    if (savedPlans) setPlans(JSON.parse(savedPlans));

    const savedCurrent = localStorage.getItem('timeflow_current');
    if (savedCurrent) {
      const parsed = JSON.parse(savedCurrent);
      setCurrentTask(parsed);
      setTaskName(parsed.name);
      if (parsed.categoryId) setSelectedCategoryId(parsed.categoryId);
    }

    const savedSub = localStorage.getItem('timeflow_sub_current');
    if (savedSub) {
      const parsed = JSON.parse(savedSub);
      setCurrentSubTask(parsed);
      setSubTaskName(parsed.name);
    }
  }, []);

  // Save Data
  useEffect(() => { localStorage.setItem('timeflow_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('timeflow_plans', JSON.stringify(plans)); }, [plans]);
  useEffect(() => { localStorage.setItem('timeflow_categories', JSON.stringify(categories)); }, [categories]);

  useEffect(() => {
    if (currentTask) localStorage.setItem('timeflow_current', JSON.stringify(currentTask));
    else localStorage.removeItem('timeflow_current');
  }, [currentTask]);

  useEffect(() => {
    if (currentSubTask) localStorage.setItem('timeflow_sub_current', JSON.stringify(currentSubTask));
    else localStorage.removeItem('timeflow_sub_current');
  }, [currentSubTask]);

  // Timers
  useEffect(() => {
    if (currentTask) {
      const calculateElapsed = () => {
        const now = Date.now();
        const start = new Date(currentTask.startTime).getTime();
        setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
      };
      calculateElapsed();
      timerRef.current = setInterval(calculateElapsed, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [currentTask]);

  useEffect(() => {
    if (currentSubTask) {
      const calculateSubElapsed = () => {
        const now = Date.now();
        const start = new Date(currentSubTask.startTime).getTime();
        setSubElapsed(Math.max(0, Math.floor((now - start) / 1000)));
      };
      calculateSubElapsed();
      subTimerRef.current = setInterval(calculateSubElapsed, 1000);
    } else {
      clearInterval(subTimerRef.current);
      setSubElapsed(0);
    }
    return () => clearInterval(subTimerRef.current);
  }, [currentSubTask]);

  // PiP Toggle
  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    if (!window.documentPictureInPicture) {
      alert("您的浏览器不支持独立悬浮窗 (Document PiP)。请使用最新版 Chrome 或 Edge。");
      return;
    }

    if (window.self !== window.top) {
      alert("注意：独立悬浮窗 (PiP) 无法在预览/iframe 环境中运行。请下载代码并在本地或全屏页面中运行。已为您切换到页内悬浮模式。");
      setIsMiniMode(true);
      return;
    }

    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 340,
        height: 600,
      });

      // Copy styles
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = styleSheet.href;
            pip.document.head.appendChild(newLink);
          } else if (styleSheet.cssRules) {
            const newStyle = document.createElement('style');
            [...styleSheet.cssRules].forEach((rule) => {
              newStyle.appendChild(document.createTextNode(rule.cssText));
            });
            pip.document.head.appendChild(newStyle);
          }
        } catch (e) {
          // ignore CORS errors for stylesheets
        }
      });

      // Copy internal style tags (Tailwind injected)
      const styles = document.querySelectorAll('style');
      styles.forEach(style => {
        pip.document.head.appendChild(style.cloneNode(true));
      });

      if (isDarkMode) pip.document.documentElement.classList.add('dark');

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (err) {
      console.error("PiP failed", err);
    }
  };

  const startTimer = () => {
    if (!taskName.trim()) return;
    const newTask = {
      id: generateId(),
      name: taskName,
      startTime: new Date().toISOString(),
      duration: 0,
      categoryId: selectedCategoryId,
      type: 'main'
    };
    setCurrentTask(newTask);
  };

  const stopTimer = () => {
    if (!currentTask) return;
    const endTime = new Date().toISOString();
    const completedTask = {
      ...currentTask,
      endTime,
      duration: elapsed,
      date: toLocalDateString(new Date())
    };
    setTasks([completedTask, ...tasks]);
    setCurrentTask(null);
    setTaskName('');
    setElapsed(0);
  };

  const adjustStartTime = (minutes) => {
    if (!currentTask) return;
    const newStartTime = new Date(new Date(currentTask.startTime).getTime() + minutes * 60000);
    if (newStartTime > new Date()) return;
    setCurrentTask({ ...currentTask, startTime: newStartTime.toISOString() });
  };

  const startSubTimer = () => {
    if (!subTaskName.trim()) return;
    const subCat = categories.find(c => c.id === 'sub') || categories[categories.length - 1];

    const newSubTask = {
      id: generateId(),
      name: subTaskName,
      startTime: new Date().toISOString(),
      duration: 0,
      categoryId: subCat.id,
      type: 'sub'
    };
    setCurrentSubTask(newSubTask);
  };

  const stopSubTimer = () => {
    if (!currentSubTask) return;
    const endTime = new Date().toISOString();
    const completedTask = {
      ...currentSubTask,
      endTime,
      duration: subElapsed,
      date: toLocalDateString(new Date())
    };
    setTasks([completedTask, ...tasks]);
    setCurrentSubTask(null);
    setSubTaskName('');
    setSubElapsed(0);
  };

  const deleteTask = (id, isPlan = false) => {
    if (confirm('确定删除这条记录吗？')) {
      if (isPlan) {
        setPlans(plans.filter(t => t.id !== id));
      } else {
        setTasks(tasks.filter(t => t.id !== id));
      }
    }
  };

  const updateCategory = (id, field, value) => {
    setCategories(categories.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const applyColorPalette = (paletteName) => {
    const colors = COLOR_PALETTES[paletteName];
    if (!colors) return;

    const newCategories = categories.map((cat, index) => {
      const newColor = colors[index % colors.length];
      return { ...cat, color: newColor };
    });

    setCategories(newCategories);
  };

  const addCategory = () => {
    setCategories([...categories, { id: generateId(), name: '新分类', color: '#64748b' }]);
  };

  const removeCategory = (id) => {
    if (categories.length <= 1) return alert('至少保留一个分类');
    if (confirm('确定删除这个分类吗？')) {
      setCategories(categories.filter(c => c.id !== id));
      if (selectedCategoryId === id) setSelectedCategoryId(categories.find(c => c.id !== id).id);
    }
  };

  const resetCategories = () => {
    if (confirm('恢复默认分类？')) setCategories(DEFAULT_CATEGORIES);
  };

  const openManualModal = () => {
    setManualForm({
      name: '',
      date: viewDate,
      startTime: '09:00',
      endTime: '10:00',
      categoryId: categories[0]?.id || '',
      type: 'actual'
    });
    setIsManualModalOpen(true);
  };

  const saveManualEntry = () => {
    if (!manualForm.name) return alert('请输入任务名称');

    // Explicitly construct dates in local time to avoid any timezone shifts
    const [y, m, d] = manualForm.date.split('-').map(Number);
    const [h, min] = manualForm.startTime.split(':').map(Number);
    const [eh, emin] = manualForm.endTime.split(':').map(Number);

    const startDateTime = new Date(y, m - 1, d, h, min, 0);
    let endDateTime = new Date(y, m - 1, d, eh, emin, 0);

    // Handle overnight tasks (end time next day)
    if (endDateTime <= startDateTime) {
      endDateTime = new Date(y, m - 1, d + 1, eh, emin, 0);
    }

    const duration = Math.floor((endDateTime - startDateTime) / 1000);
    const newTask = {
      id: generateId(),
      name: manualForm.name,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration: duration,
      date: manualForm.date,
      categoryId: manualForm.categoryId
    };

    if (manualForm.type === 'plan') {
      setPlans([newTask, ...plans]);
    } else {
      setTasks([newTask, ...tasks]);
    }

    setIsManualModalOpen(false);
  };

  if (currentPage === 'printer') {
    return <PhotoPrinter onBack={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-dot-pattern text-slate-900 dark:text-slate-100 pb-20 font-sans transition-colors duration-300">
      <PrintStyles />

      <ManualEntryModal
        isManualModalOpen={isManualModalOpen}
        setIsManualModalOpen={setIsManualModalOpen}
        manualForm={manualForm}
        setManualForm={setManualForm}
        saveManualEntry={saveManualEntry}
        categories={categories}
      />

      <CategoryManagerModal
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        categories={categories}
        applyColorPalette={applyColorPalette}
        updateCategory={updateCategory}
        removeCategory={removeCategory}
        addCategory={addCategory}
        resetCategories={resetCategories}
      />

      <div className={`container mx-auto pt-6 px-4 md:px-6 lg:px-8 transition-all duration-500`}>
        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-8 items-start`}>

          {/* Timer Section - Render in Main Window OR via Portal in PiP */}
          {!pipWindow && (
            <div className={`${isMiniMode ? 'fixed bottom-6 right-6 z-50 w-auto' : 'xl:col-span-4 xl:sticky xl:top-6'}`}>
              <TimerInterface
                isMiniMode={isMiniMode}
                setIsMiniMode={setIsMiniMode}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                currentTime={currentTime}
                elapsed={elapsed}
                currentTask={currentTask}
                taskName={taskName}
                setTaskName={setTaskName}
                startTimer={startTimer}
                stopTimer={stopTimer}
                adjustStartTime={adjustStartTime}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                openManualModal={openManualModal}
                setIsCategoryModalOpen={setIsCategoryModalOpen}
                subElapsed={subElapsed}
                currentSubTask={currentSubTask}
                subTaskName={subTaskName}
                setSubTaskName={setSubTaskName}
                startSubTimer={startSubTimer}
                stopSubTimer={stopSubTimer}
                togglePiP={togglePiP}
                isPiPActive={false}
              />
            </div>
          )}

          {pipWindow && createPortal(
            <div className="h-full w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-0 overflow-hidden">
              <TimerInterface
                isMiniMode={false} // Always full in PiP
                setIsMiniMode={() => { }}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                currentTime={currentTime}
                elapsed={elapsed}
                currentTask={currentTask}
                taskName={taskName}
                setTaskName={setTaskName}
                startTimer={startTimer}
                stopTimer={stopTimer}
                adjustStartTime={adjustStartTime}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                openManualModal={openManualModal}
                setIsCategoryModalOpen={setIsCategoryModalOpen}
                subElapsed={subElapsed}
                currentSubTask={currentSubTask}
                subTaskName={subTaskName}
                setSubTaskName={setSubTaskName}
                startSubTimer={startSubTimer}
                stopSubTimer={stopSubTimer}
                togglePiP={togglePiP}
                isPiPActive={true}
              />
            </div>,
            pipWindow.document.body
          )}


          {!isMiniMode && (
            <div className="xl:col-span-8 space-y-8 animate-fade-in-up w-full">
              {/* Flex container for Chart + Stats */}
              <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
                <div className="flex-1 w-full min-w-0">
                  {/* Navigation Header for Dashboard */}
                  <div className="no-print flex justify-end mb-4">
                    <button
                      onClick={() => setCurrentPage('printer')}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors font-bold text-sm"
                    >
                      <Printer size={16} /> 照片打印工具
                    </button>
                  </div>
                  <WeeklyReportInterface
                    viewDate={viewDate}
                    setViewDate={setViewDate}
                    tasks={tasks}
                    plans={plans}
                    categories={categories}
                    openManualModal={openManualModal}
                  />
                </div>

                {/* Stats Panel - Moved here to be side-by-side on XL, stacked on smaller */}
                <div className="no-print w-full xl:w-80 flex-shrink-0">
                  <StatsInterface
                    tasks={tasks}
                    categories={categories}
                    weekStartStr={getStartOfWeek(viewDate).toISOString().split('T')[0]}
                    weekEndStr={(() => {
                      const d = getStartOfWeek(viewDate);
                      d.setDate(d.getDate() + 6);
                      return d.toISOString().split('T')[0];
                    })()}
                  />
                </div>
              </div>

              <div className="w-full no-print">
                <div className="flex items-center gap-2 px-2 mb-4">
                  <CheckCircle size={20} className="text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">今日清单 ({viewDate})</h2>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                  {tasks.filter(t => t.date === viewDate).length === 0 ? (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <Calendar size={20} />
                      </div>
                      <p>本日暂无记录，开始你的专注之旅吧</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {tasks.filter(t => t.date === viewDate).slice().reverse().map(task => {
                        const cat = getCategory(categories, task.categoryId || task.category?.id);
                        return (
                          <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                            <div className="flex items-start gap-4">
                              <span className="mt-1.5 w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: cat.color }}></span>
                              <div>
                                <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 text-lg">
                                  {task.name}
                                  {task.type === 'sub' && <span className="text-[10px] bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Parallel</span>}
                                </div>
                                <div className="text-xs text-slate-400 font-mono mt-1.5 flex gap-2 items-center">
                                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                    {formatTime(new Date(task.startTime))} - {formatTime(new Date(task.endTime))}
                                  </span>
                                  <span className="opacity-30">|</span>
                                  <span style={{ color: cat.color }} className="font-medium">{cat.name}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-lg">{formatDuration(task.duration)}</span>
                              <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {isMiniMode && !pipWindow && <div className="fixed inset-0 pointer-events-none no-print"></div>}
    </div >
  );
}

export default App;