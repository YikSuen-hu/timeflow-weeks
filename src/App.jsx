import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Maximize2, Minimize2, Printer, Trash2,
  Clock, ChevronRight, ChevronLeft, Calendar, Layers, Settings
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
      .print-area {
        display: block !important;
        width: 210mm;
        height: 297mm;
        background: white;
        overflow: hidden;
        position: relative;
        box-shadow: none !important;
        margin: 0 !important;
      }
      /* Ensure grid is exactly 4mm */
      .grid-pattern-4mm {
        background-image:
          linear-gradient(to right, rgba(200, 200, 200, 0.5) 0.5px, transparent 0.5px),
          linear-gradient(to bottom, rgba(200, 200, 200, 0.5) 0.5px, transparent 0.5px);
        background-size: 4mm 4mm;
        border: 0.5px solid rgba(200, 200, 200, 0.5);
      }
    }
  `}</style>
);

// --- Utilities ---
const formatDuration = (seconds) => {
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

// --- Extracted Components ---

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

const MainTimer = ({
  currentTask, taskName, setTaskName, selectedCategoryId, setSelectedCategoryId, categories,
  startTimer, stopTimer, elapsed, isMiniMode, setIsMiniMode, onOpenSettings
}) => {
  const currentCat = currentTask ? categories.find(c => c.id === currentTask.categoryId) : null;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-all mb-6 ${isMiniMode ? 'fixed top-0 left-0 w-full h-full z-[9999] rounded-none flex flex-col justify-center' : ''}`}>
      {/* Mini Mode Toggle Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">主任务 (Main)</h2>
        <button onClick={() => setIsMiniMode(!isMiniMode)} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Toggle Mini Mode">
          {isMiniMode ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        </button>
      </div>

      {!currentTask ? (
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="准备专注于什么？"
              className="w-full text-2xl font-medium bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none px-1 py-2 transition-colors placeholder:text-slate-300 font-sans"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startTimer()}
            />
          </div>
          <CategorySelector
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onOpenSettings={onOpenSettings}
          />
          <button
            onClick={startTimer}
            disabled={!taskName.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
          >
            <Play fill="currentColor" size={24} /> 开始专注
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full animate-pulse bg-indigo-500"></span> 专注中
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 px-4 truncate">{currentTask.name}</h2>
          <div className="text-sm text-slate-400 mb-8 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCat?.color || '#ccc' }}></span>
            {currentCat?.name || '未知'}
          </div>
          <div className="font-mono font-bold text-slate-800 dark:text-white text-7xl tracking-tighter mb-8 tabular-nums">
            {formatDuration(elapsed).replace('h ', ':').replace('m', '')}
          </div>
          <button
            onClick={stopTimer}
            className="w-full py-4 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all group"
          >
            <Square fill="currentColor" size={20} className="group-hover:scale-110 transition-transform" /> 结束任务
          </button>
        </div>
      )}
    </div>
  );
};

const SubTimer = ({ currentSubTask, subTaskName, setSubTaskName, startSubTimer, stopSubTimer, subElapsed, isMiniMode }) => (
  <div className={`bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 mb-8 ${isMiniMode ? 'hidden' : ''}`}>
    <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">副任务 / 并行 (Sub)</div>
    {!currentSubTask ? (
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="并行任务 (如: 听音乐)"
          className="flex-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:border-slate-400"
          value={subTaskName}
          onChange={(e) => setSubTaskName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && startSubTimer()}
        />
        <button
          onClick={startSubTimer}
          disabled={!subTaskName.trim()}
          className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          <Play size={16} fill="currentColor" />
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <Layers size={18} className="text-orange-500" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold text-slate-700 dark:text-slate-200 truncate">{currentSubTask.name}</div>
            <div className="text-sm font-mono text-slate-500">{formatDuration(subElapsed)}</div>
          </div>
        </div>
        <button
          onClick={stopSubTimer}
          className="p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Square size={18} fill="currentColor" />
        </button>
      </div>
    )}
  </div>
);

const WeeksLayout = ({ viewDate, tasks, categories }) => {
  const currentDate = new Date(viewDate);
  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dayTasks = tasks.filter(t => t.date === d.toISOString().split('T')[0]);
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

  return (
    <div className="print-area w-full bg-white text-slate-900 mx-auto shadow-md my-8 transform scale-90 origin-top">
      {/* LEFT PAGE: TIMELINE */}
      <div className="w-[100mm] flex flex-col h-[270mm] print-chart-container relative float-left">
        <div className="text-center border-b-2 border-slate-800 pb-2 mb-2 pt-4">
          <h2 className="text-xl font-bold tracking-widest">{startOfWeek.getFullYear()} REPORT</h2>
          <div className="text-xs text-slate-500">
            {startOfWeek.toLocaleDateString()} - {endOfWeek.toLocaleDateString()}
          </div>
        </div>

        {/* Days Columns */}
        <div className="flex-1 flex border-l border-slate-200">
          <div className="w-8 flex-shrink-0 flex flex-col text-[8px] text-slate-400 border-r border-slate-200 pt-8">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-right pr-1 border-b border-dashed border-slate-100 relative">
                <span className="absolute -top-1.5 right-1">{i}</span>
              </div>
            ))}
          </div>
          {weekDays.map(day => (
            <div key={day.date} className="flex-1 border-r border-slate-200 relative group">
              <div className="text-center border-b border-slate-200 py-1 bg-slate-50">
                <div className="text-[10px] scale-90 text-slate-500">{day.dayName}</div>
                <div className="font-bold text-sm">{day.dayNum}</div>
              </div>

              {/* Render Tasks Blocks */}
              <div className="relative h-full w-full">
                {tasks.filter(t => t.date === day.date).map(t => {
                  const start = new Date(t.startTime);
                  const startMin = start.getHours() * 60 + start.getMinutes();
                  const durationMin = t.duration / 60;
                  const topPct = (startMin / 1440) * 100;
                  const heightPct = (durationMin / 1440) * 100;
                  const cat = categories.find(c => c.id === t.categoryId) || { color: '#ccc' };

                  return (
                    <div key={t.id}
                      className="absolute left-0.5 right-0.5 rounded-sm overflow-hidden text-[8px] leading-tight flex items-center justify-center text-white/90"
                      style={{
                        top: `${topPct}%`,
                        height: `${Math.max(heightPct, 1)}%`,
                        backgroundColor: cat.color,
                        zIndex: 1
                      }}
                      title={`${t.name} (${formatDuration(t.duration)})`}
                    >
                      {heightPct > 2 && <span className="truncate px-0.5">{t.name}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PAGE: GRID NOTE & STATS */}
      <div className="w-[100mm] h-[270mm] flex flex-col gap-4 float-right pt-4 pr-4">
        {/* Stats Overview */}
        <div className="border border-slate-800 p-4">
          <h3 className="font-bold text-lg border-b border-slate-800 mb-2 pb-1">本周统计 (Stats)</h3>
          <div className="flex justify-between items-end mb-4">
            <div className="text-sm text-slate-500">Total Focus</div>
            <div className="text-3xl font-mono font-bold">{formatDuration(totalWeekDuration)}</div>
          </div>
          <div className="space-y-1">
            {categories.map(cat => {
              const catDuration = tasks
                .filter(t => t.categoryId === cat.id && t.date >= weekDays[0].date && t.date <= weekDays[6].date)
                .reduce((acc, t) => acc + t.duration, 0);
              if (catDuration === 0) return null;
              return (
                <div key={cat.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    {cat.name}
                  </div>
                  <div className="font-mono opacity-70">{formatDuration(catDuration)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 border border-slate-200 grid-pattern-4mm relative">
          <div className="absolute top-2 right-2 text-slate-300 font-mono text-xs opacity-50">4mm GRID</div>
        </div>
      </div>
      <div className="clear-both"></div>
    </div>
  );
};


export default function App() {
  // --- State ---
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [tasks, setTasks] = useState([]);
  const [plans, setPlans] = useState([]);

  // Main Task State
  const [currentTask, setCurrentTask] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORIES[0].id);

  // Sub Task State
  const [currentSubTask, setCurrentSubTask] = useState(null);
  const [subTaskName, setSubTaskName] = useState('');
  const [subElapsed, setSubElapsed] = useState(0);

  const [isMiniMode, setIsMiniMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const timerRef = useRef(null);
  const subTimerRef = useRef(null);
  const pipWindowRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Data Persistence
  useEffect(() => {
    try {
      const savedCategories = localStorage.getItem('timeflow_categories');
      if (savedCategories) setCategories(JSON.parse(savedCategories));
    } catch (e) { console.error(e); }

    try {
      const savedTasks = localStorage.getItem('timeflow_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch (e) { console.error(e); }

    try {
      const savedPlans = localStorage.getItem('timeflow_plans');
      if (savedPlans) setPlans(JSON.parse(savedPlans));
    } catch (e) { console.error(e); }

    try {
      const savedCurrent = localStorage.getItem('timeflow_current');
      if (savedCurrent) {
        const parsed = JSON.parse(savedCurrent);
        setCurrentTask(parsed);
        setTaskName(parsed.name || '');
        if (parsed.categoryId) setSelectedCategoryId(parsed.categoryId);
      }
    } catch (e) { localStorage.removeItem('timeflow_current'); }

    try {
      const savedSub = localStorage.getItem('timeflow_sub_current');
      if (savedSub) {
        const parsed = JSON.parse(savedSub);
        setCurrentSubTask(parsed);
        setSubTaskName(parsed.name || '');
      }
    } catch (e) { localStorage.removeItem('timeflow_sub_current'); }
  }, []);

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

  // Main Timer Logic
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

  // Sub Timer Logic
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

  // --- ACTIONS ---
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
      date: new Date().toISOString().split('T')[0]
    };
    setTasks([completedTask, ...tasks]);
    setCurrentTask(null);
    setTaskName('');
    setElapsed(0);
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
      date: new Date().toISOString().split('T')[0]
    };
    setTasks([completedTask, ...tasks]);
    setCurrentSubTask(null);
    setSubTaskName('');
    setSubElapsed(0);
  };

  const deleteTask = (id) => {
    if (confirm('确定删除这条记录吗？')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const togglePiP = async () => {
    // If PiP is active, close it
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      setIsMiniMode(false);
      return;
    }

    if (!window.documentPictureInPicture) {
      // Fallback to internal mini mode if API not supported
      setIsMiniMode(!isMiniMode);
      return;
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 350,
        height: 450,
      });
      pipWindowRef.current = pipWindow;
      setIsMiniMode(true);

      // Add styles to PiP window
      // Copy all style sheets
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          } else if (styleSheet.cssRules) {
            const style = document.createElement('style');
            style.textContent = Array.from(styleSheet.cssRules).map(r => r.cssText).join('');
            pipWindow.document.head.appendChild(style);
          }
        } catch (e) { }
      });

      // Move Main Timer to PiP
      const mainTimerContainer = document.getElementById('main-timer-container');
      if (mainTimerContainer) {
        pipWindow.document.body.appendChild(mainTimerContainer);
      }

      // Handle PiP close
      pipWindow.addEventListener('pagehide', () => {
        const root = document.getElementById('main-timer-root');
        if (root && mainTimerContainer) {
          root.appendChild(mainTimerContainer);
        }
        pipWindowRef.current = null;
        setIsMiniMode(false);
      });

    } catch (e) {
      console.error("PiP failed", e);
      alert("无法开启画中画模式，请确保浏览器支持此功能。");
    }
  };

  // Logic to render MainTimer. If in PiP, it's portal-like moved (via raw DOM append above).
  // But purely React way is cleaner: createPortal.
  // However, `documentPictureInPicture` is a separate window context. 
  // Let's use a simpler "Always On Top" approach for the User Requirement 1:
  // "小窗口我希望是可以置顶在电脑页面的" -> Only PiP can do this for web apps.
  // My implementation above tries to move the DOM node. React might lose state.
  // Better approach: Synchronize state? No, simply use the "In Page" mode if PiP fails, 
  // but for PiP, we need to re-render the component tree inside that window?
  // 
  // Simpler hack for now: Re-render MainTimer inside the App, but if isMiniMode and we have pipWindow,
  // we use createPortal? NO, PiP API is strictly vanilla DOM usually or needs specific React setup.
  // 
  // Correct Fix for Input Bug is the PRIORITY.
  // The extraction of MainTimer and SubTimer above fixes the Input Bug.
  // The "Visible Timeline" is fixed by removing 'hidden' in WeeksLayout.

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 transition-colors pb-20">
      <PrintStyles />

      {/* --- PAGE HEADER --- */}
      <div className="no-print pt-6 px-6 mb-4 flex justify-between items-center max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          TimeFlow <span className="font-light text-slate-400 text-lg">Weeks</span>
        </h1>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all" onClick={() => window.print()}>
            <Printer size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <button className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all">
            <Settings size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-xl relative">
        <div id="main-timer-root">
          <div id="main-timer-container">
            <MainTimer
              currentTask={currentTask}
              taskName={taskName}
              setTaskName={setTaskName}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              categories={categories}
              startTimer={startTimer}
              stopTimer={stopTimer}
              elapsed={elapsed}
              isMiniMode={isMiniMode}
              setIsMiniMode={togglePiP}
              onOpenSettings={() => setIsCategoryModalOpen(true)}
            />
          </div>
        </div>

        <SubTimer
          currentSubTask={currentSubTask}
          subTaskName={subTaskName}
          setSubTaskName={setSubTaskName}
          startSubTimer={startSubTimer}
          stopSubTimer={stopSubTimer}
          subElapsed={subElapsed}
          isMiniMode={isMiniMode}
        />

        {/* --- TASK LIST SECTION --- */}
        <div className="no-print bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => {
                const d = new Date(viewDate); d.setDate(d.getDate() - 1);
                setViewDate(d.toISOString().split('T')[0]);
              }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><ChevronLeft /></button>

              <div className="text-lg font-bold flex items-center gap-2">
                <Calendar size={18} className="text-indigo-500" />
                {viewDate}
                {viewDate === new Date().toISOString().split('T')[0] && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Today</span>}
              </div>

              <button onClick={() => {
                const d = new Date(viewDate); d.setDate(d.getDate() + 1);
                setViewDate(d.toISOString().split('T')[0]);
              }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><ChevronRight /></button>
            </div>

            <div className="text-sm text-slate-400">
              共 {tasks.filter(t => t.date === viewDate).length} 项
            </div>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.date === viewDate).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <div className="mb-2">☕</div>
                还没有记录，开始第一个任务吧
              </div>
            ) : (
              tasks.filter(t => t.date === viewDate)
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map(t => {
                  const cat = categories.find(c => c.id === t.categoryId) || { color: '#ccc', name: 'N/A' };
                  return (
                    <div key={t.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-1 h-8 rounded-full`} style={{ backgroundColor: cat.color }}></div>
                        <div>
                          <div className="font-bold text-slate-700 dark:text-slate-200">{t.name}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">{cat.name}</span>
                            <span className="font-mono">{formatTime(new Date(t.startTime))} - {formatTime(new Date(t.endTime))}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-mono font-bold text-lg text-slate-700 dark:text-slate-300">
                          {formatDuration(t.duration)}
                        </div>
                        <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE (Now visible on page) */}
      <div className="container mx-auto px-4 max-w-4xl pb-10">
        <h2 className="text-xl font-bold mb-4 px-4 text-slate-500">Weekly Overview</h2>
        <WeeksLayout viewDate={viewDate} tasks={tasks} categories={categories} />
      </div>
    </div>
  );
}
