import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Maximize2, Minimize2, Printer, Trash2,
  Clock, ChevronRight, ChevronLeft, CheckCircle, Plus,
  Edit2, X, Save, Settings, RotateCcw, Layers, Zap, Calendar, Layout, Eye, EyeOff
} from 'lucide-react';

// --- CSS for Print & Grid ---
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
      }
      .print-chart-container {
        background: white;
        box-shadow: none !important;
      }
    }
    
    /* 4mm Grid Pattern */
    .grid-pattern-4mm {
      background-size: 4mm 4mm;
      background-image:
        linear-gradient(to right, rgba(200, 200, 200, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(200, 200, 200, 0.3) 1px, transparent 1px);
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

export default function App() {
  // --- State ---
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [tasks, setTasks] = useState([]); // Actual tasks
  const [plans, setPlans] = useState([]); // Planned tasks

  // Main Task State
  const [currentTask, setCurrentTask] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORIES[0].id);

  // Sub Task State (Parallel)
  const [currentSubTask, setCurrentSubTask] = useState(null);
  const [subTaskName, setSubTaskName] = useState('');
  const [subElapsed, setSubElapsed] = useState(0);

  const [isMiniMode, setIsMiniMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [manualForm, setManualForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    categoryId: DEFAULT_CATEGORIES[0].id,
    type: 'actual' // 'actual' | 'plan'
  });

  const timerRef = useRef(null);
  const subTimerRef = useRef(null);

  const getCategory = (id) => categories.find(c => c.id === id) || { name: '未知', color: '#cbd5e1' };

  // --- Effects ---
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Data Persistence
  useEffect(() => {
    const savedCategories = localStorage.getItem('timeflow_categories');
    if (savedCategories) setCategories(JSON.parse(savedCategories));

    const savedTasks = localStorage.getItem('timeflow_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedPlans = localStorage.getItem('timeflow_plans');
    if (savedPlans) setPlans(JSON.parse(savedPlans));

    // Restore Main Task
    const savedCurrent = localStorage.getItem('timeflow_current');
    if (savedCurrent) {
      const parsed = JSON.parse(savedCurrent);
      setCurrentTask(parsed);
      setTaskName(parsed.name);
      if (parsed.categoryId) setSelectedCategoryId(parsed.categoryId);
    }

    // Restore Sub Task
    const savedSub = localStorage.getItem('timeflow_sub_current');
    if (savedSub) {
      const parsed = JSON.parse(savedSub);
      setCurrentSubTask(parsed);
      setSubTaskName(parsed.name);
    }
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

  // --- Actions ---
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

  const adjustStartTime = (minutes) => {
    if (!currentTask) return;
    const newStartTime = new Date(new Date(currentTask.startTime).getTime() + minutes * 60000);
    if (newStartTime > new Date()) return;
    setCurrentTask({ ...currentTask, startTime: newStartTime.toISOString() });
  };

  // Sub Task Actions
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
    const startDateTime = new Date(`${manualForm.date}T${manualForm.startTime}`);
    const endDateTime = new Date(`${manualForm.date}T${manualForm.endTime}`);
    if (endDateTime <= startDateTime) return alert('结束时间必须晚于开始时间');

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

  // --- Components ---
  const CategorySelector = ({ selectedId, onSelect }) => (
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
        onClick={() => setIsCategoryModalOpen(true)}
        className="px-2 py-1 rounded-full text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Settings size={14} />
      </button>
    </div>
  );

  const TimerInterface = () => {
    const currentCat = currentTask ? getCategory(currentTask.categoryId) : null;
    return (
      <div className={`transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col mb-8
        ${isMiniMode
          ? 'fixed bottom-6 right-6 w-80 rounded-2xl z-50'
          : 'relative w-full max-w-xl mx-auto rounded-3xl'
        } no-print`}>

        {/* Header */}
        <div className={`flex justify-between items-center border-b border-slate-100 dark:border-slate-700 ${isMiniMode ? 'p-3 bg-white dark:bg-slate-800' : 'p-4'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="font-mono text-xl font-bold text-slate-800 dark:text-slate-100 leading-none">
                {formatFullTime(currentTime)}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">TimeFlow Weeks</div>
            </div>
          </div>
          <button onClick={() => setIsMiniMode(!isMiniMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            {isMiniMode ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
        </div>

        {/* --- SECTION 1: MAIN TASK --- */}
        <div className={`flex-1 ${isMiniMode ? 'p-4' : 'p-6'}`}>
          {!currentTask ? (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="准备专注于什么？"
                  className="w-full text-lg font-medium bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none px-1 py-2 transition-colors placeholder:text-slate-300"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startTimer()}
                  autoFocus
                />
              </div>
              <CategorySelector selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} />
              <button
                onClick={startTimer}
                disabled={!taskName.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
              >
                <Play fill="currentColor" size={20} /> 开始专注
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-4">
                <span className="w-2 h-2 rounded-full animate-pulse bg-indigo-500"></span>
                专注中
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 px-4 truncate">{currentTask.name}</h2>
              <div className="text-sm text-slate-400 mb-6 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCat.color }}></span>
                {currentCat.name}
              </div>

              <div className="font-mono font-bold text-slate-800 dark:text-white text-6xl tracking-tighter mb-8 tabular-nums">
                {formatDuration(elapsed).replace('h ', ':').replace('m', '')}
              </div>

              <button
                onClick={stopTimer}
                className="w-full py-3.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all group"
              >
                <Square fill="currentColor" size={18} className="group-hover:scale-110 transition-transform" /> 结束任务
              </button>
            </div>
          )}
        </div>

        {/* --- SECTION 2: SUB TASK (Parallel) --- */}
        <div className={`border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 ${isMiniMode ? 'p-3' : 'p-4'}`}>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Layers size={14} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{currentSubTask.name}</div>
                  <div className="text-xs font-mono text-slate-500">{formatDuration(subElapsed)}</div>
                </div>
              </div>
              <button
                onClick={stopSubTimer}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Square size={16} fill="currentColor" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const WeeksLayout = () => {
    // Filter tasks for the selected week
    const currentDate = new Date(viewDate);
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    // Generate 7 days
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
        dayNum: d.getDate()
      };
    });

    return (
      <div className="print-area hidden w-full h-full bg-white text-slate-900">
        {/* LEFT PAGE: TIMELINE */}
        <div className="w-[100mm] flex flex-col h-[270mm] print-chart-container relative">
          <div className="text-center border-b-2 border-slate-800 pb-2 mb-2">
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
                    const end = new Date(t.endTime);
                    const startMin = start.getHours() * 60 + start.getMinutes();
                    const durationMin = t.duration / 60;
                    const topPct = (startMin / 1440) * 100;
                    const heightPct = (durationMin / 1440) * 100;
                    const cat = getCategory(t.categoryId);

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

        {/* RIGHT PAGE: GRID NOTE */}
        <div className="w-[85mm] h-[270mm] border border-slate-200 grid-pattern-4mm p-4 relative">
          <div className="absolute top-4 right-4 text-slate-400 font-mono text-sm opacity-50">MEMO</div>
          {/* This area is for hand-written notes */}
        </div>
      </div>
    );
  };

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

      <div className="container mx-auto px-4 max-w-4xl relative">
        <TimerInterface />

        {/* --- TASK LIST SECTION --- */}
        <div className="no-print bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
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
                  const cat = getCategory(t.categoryId);
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

        {/* --- WEEKS PRINT LAYOUT (Hidden unless printing) --- */}
        <WeeksLayout />

      </div>
    </div>
  );
}
