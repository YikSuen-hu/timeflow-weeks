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
      <div className={`transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col
        ${isMiniMode 
          ? 'fixed bottom-6 right-6 w-80 rounded-2xl z-50' 
          : 'relative w-full max-w-lg mx-auto rounded-3xl mb-8'
        } no-print`}>
        
        {/* Header */}
        <div className={`flex justify-between items-start border-b border-slate-100 dark:border-slate-700 ${isMiniMode ? 'p-3 bg-white dark:bg-slate-800' : 'p-4'}`}>
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">北京时间</span>
            </div>
            <div className="font-mono text-xl text-slate-900 dark:text-white font-bold leading-none mt-1">
              {formatFullTime(currentTime)}
            </div>
          </div>
          <button onClick={() => setIsMiniMode(!isMiniMode)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500">
            {isMiniMode ? <Maximize2 size={16} /> : <Minimize2 size={18} />}
          </button>
        </div>

        {/* --- SECTION 1: MAIN TASK (Larger Area) --- */}
        <div className={`flex-1 ${isMiniMode ? 'p-4' : 'p-6 pb-8'}`}>
          <div className="text-center mb-6 relative group">
            <div className={`font-mono font-bold text-slate-800 dark:text-white transition-all ${isMiniMode ? 'text-5xl' : 'text-7xl tracking-tighter'}`}>
              {formatDuration(elapsed).replace('h ', ':').replace('m', '')}
              <span className="text-sm font-normal text-slate-400 ml-1">{currentCat ? currentCat.name : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
      <PrintStyles />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">TimeFlow Weeks Manager</h1>
        <TimerInterface />
      </div>
    </div>
  );
}
