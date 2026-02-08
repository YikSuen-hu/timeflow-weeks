import React, { useState } from 'react';
import { Plus, MoreHorizontal, Calendar, Trash2, ArrowRight, CheckCircle, Circle, Clock, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';

const Column = ({ title, status, icon: Icon, tasks, categories, updateTaskStatus, deleteTask, onScheduleTask, handleAddTask, newTaskName, setNewTaskName, handleAddSubTask, toggleSubTaskStatus, deleteSubTask, newTaskCategory, setNewTaskCategory, allTasks, allPlans }) => {

    // Helper to determine display status
    const getTaskDisplayStatus = (task) => {
        if (!task.subtasks || task.subtasks.length === 0) return task.status; // Fallback to manual status if no subtasks

        const allDone = task.subtasks.every(s => s.status === 'done');
        const allTodo = task.subtasks.every(s => s.status === 'todo');

        if (allDone) return 'done';
        if (allTodo) return 'todo';
        return 'doing';
    };

    // Filter tasks based on computed status (or manual if no subtasks)
    const columnTasks = tasks.filter(t => {
        const displayStatus = getTaskDisplayStatus(t);
        return displayStatus === status;
    });

    const getCategoryColor = (id) => {
        const cat = categories.find(c => c.id === id) || { color: '#cbd5e1' };
        return cat.color;
    };

    const mysub = (subName) => {
        if (!subName) return { scheduled: 0, executed: 0 };
        const scheduled = allPlans ? allPlans.filter(p => p.name === subName).reduce((acc, curr) => acc + (curr.duration || 0), 0) : 0;
        const executed = allTasks ? allTasks.filter(t => t.name === subName).reduce((acc, curr) => acc + (curr.duration || 0), 0) : 0;
        return { scheduled, executed };
    };

    const formatHours = (seconds) => (seconds / 3600).toFixed(1);

    return (
        <div className="flex-1 min-w-[320px] flex flex-col h-full bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                    <Icon size={18} className="text-slate-400" />
                    {title}
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">
                        {columnTasks.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {columnTasks.map(task => (
                    <div key={task.id} className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all animate-fade-in-up">
                        <div className="flex justify-between items-start mb-2">
                            <span
                                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: getCategoryColor(task.categoryId) }}
                            ></span>
                            <div className="flex-1 mx-3 min-w-0">
                                <div className="font-bold text-slate-700 dark:text-slate-200 break-words leading-tight mb-2">
                                    {task.name}
                                </div>

                                {/* Subtasks List */}
                                <div className="space-y-3 mb-3">
                                    {task.subtasks && task.subtasks.map(sub => {
                                        const stats = mysub(sub.name);
                                        const hasData = stats.scheduled > 0 || stats.executed > 0;
                                        // Max for progress bar (use max of scheduled or executed, defaulting to at least 1 hr to avoid div by zero Visuals)
                                        const max = Math.max(stats.scheduled, stats.executed, 3600);

                                        return (
                                            <div key={sub.id} className="text-sm group/sub">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleSubTaskStatus(task.id, sub.id)}
                                                        className={`mt-0.5 flex-shrink-0 ${sub.status === 'done' ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}`}
                                                    >
                                                        {sub.status === 'done' ? <CheckSquare size={14} /> : <Square size={14} />}
                                                    </button>
                                                    <span className={`flex-1 transition-all truncate ${sub.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {sub.name}
                                                    </span>

                                                    {/* Schedule Subtask Button */}
                                                    <button
                                                        onClick={() => onScheduleTask(sub.name, task.categoryId)}
                                                        className="opacity-0 group-hover/sub:opacity-100 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-all"
                                                        title="调度子任务"
                                                    >
                                                        <Calendar size={14} />
                                                    </button>

                                                    <button
                                                        onClick={() => deleteSubTask(task.id, sub.id)}
                                                        className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-all"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>

                                                {/* Progress Bar for Subtask */}
                                                {hasData && (
                                                    <div className="ml-6 mt-1.5">
                                                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                                                            <span>已安排 {formatHours(stats.scheduled)}h</span>
                                                            <span>已执行 {formatHours(stats.executed)}h</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden flex relative">
                                                            {/* Scheduled Bar (Gray/Back) */}
                                                            <div
                                                                className="absolute top-0 left-0 h-full bg-slate-300 dark:bg-slate-600 rounded-full opacity-50"
                                                                style={{ width: `${Math.min((stats.scheduled / max) * 100, 100)}%` }}
                                                            ></div>
                                                            {/* Executed Bar (Green/Front) */}
                                                            <div
                                                                className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full opacity-80"
                                                                style={{ width: `${Math.min((stats.executed / max) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Add Subtask Input */}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const input = e.target.elements.subtaskName;
                                        if (input.value.trim()) {
                                            handleAddSubTask(task.id, input.value.trim());
                                            input.value = '';
                                        }
                                    }}
                                    className="relative flex items-center mt-2 group/add"
                                >
                                    <Plus size={14} className="absolute left-2 text-slate-400" />
                                    <input
                                        name="subtaskName"
                                        type="text"
                                        placeholder="添加子任务..."
                                        className="w-full pl-7 pr-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg text-xs transition-all focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
                                    />
                                </form>
                            </div>

                            <div className="relative group/menu -mt-1 -mr-1">
                                <button className="text-slate-300 hover:text-slate-500 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <MoreHorizontal size={16} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 py-1 hidden group-hover/menu:block z-20">
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                                    >
                                        <Trash2 size={12} /> 删除任务
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-700/50 flex justify-end">
                            <div className="text-[10px] text-slate-400 font-mono">
                                {task.subtasks ? `${task.subtasks.filter(s => s.status === 'done').length}/${task.subtasks.length}` : '0/0'}
                            </div>
                        </div>
                    </div>
                ))}

                {status === 'todo' && (
                    <div className="mt-2 space-y-2">
                        {/* Category Selector for New Task */}
                        <div className="flex gap-1.5 flex-wrap px-1">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setNewTaskCategory(cat.id)}
                                    className={`w-4 h-4 rounded-full transition-all border ${newTaskCategory === cat.id ? 'scale-110 ring-2 ring-offset-1 dark:ring-offset-slate-800 ring-indigo-500/50' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                                    style={{ backgroundColor: cat.color, borderColor: newTaskCategory === cat.id ? 'transparent' : 'transparent' }}
                                    title={cat.name}
                                />
                            ))}
                        </div>

                        <form onSubmit={handleAddTask}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newTaskName}
                                    onChange={(e) => setNewTaskName(e.target.value)}
                                    placeholder="添加新大任务..."
                                    className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                    style={{ borderColor: categories.find(c => c.id === newTaskCategory)?.color || '' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!newTaskName.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-300 transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};


const TaskBoard = ({ tasks, setTasks, categories, onScheduleTask, allTasks, allPlans }) => {
    // Columns: 'todo', 'doing', 'done'
    // Task Structure: { id, name, status, categoryId, subtasks: [{id, name, status}] }

    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState(categories[0]?.id);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;
        const newTask = {
            id: Date.now().toString(),
            name: newTaskName,
            status: 'todo', // Initial status, will be overridden by subtasks logic usually
            categoryId: newTaskCategory || categories[0].id,
            estimatedDuration: 3600,
            createdAt: new Date().toISOString(),
            subtasks: []
        };
        setTasks([...tasks, newTask]);
        setNewTaskName('');
    };

    // Note: We don't really use this for columns now, status is computed. 
    // But we might need it if we drag whole cards (implemented later if requested).
    // For now, we only change subtask status.
    const updateTaskStatus = (taskId, newStatus) => {
        // Manual override if needed, or propagate to subtasks?
        // User requested: "Dragging parent... updates all sub-tasks"
        // Implementing bulk update logic:
        setTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            // Update all subtasks to match parent's new status
            // If moving to 'doing', what does that mean for subtasks? 
            // Logic: To Todo -> All Todo. To Done -> All Done. To Doing -> ??? (Maybe leave as mixed? or force one?)
            // Simple approach: Todo -> All Todo. Done -> All Done. Doing -> No-op for bulk?

            if (newStatus === 'todo') {
                return {
                    ...t,
                    status: 'todo',
                    subtasks: t.subtasks?.map(s => ({ ...s, status: 'todo' })) || []
                };
            }
            if (newStatus === 'done') {
                return {
                    ...t,
                    status: 'done',
                    subtasks: t.subtasks?.map(s => ({ ...s, status: 'done' })) || []
                };
            }
            // If doing, maybe just update parent status field (though display relies on subtasks)
            return { ...t, status: newStatus };
        }));
    };

    const deleteTask = (taskId) => {
        if (confirm('确定要删除这个任务吗？')) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    const handleAddSubTask = (taskId, subtaskName) => {
        setTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            const newSub = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name: subtaskName,
                status: 'todo'
            };
            return { ...t, subtasks: [...(t.subtasks || []), newSub] };
        }));
    };

    const toggleSubTaskStatus = (taskId, subTaskId) => {
        setTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            const updatedSubtasks = t.subtasks.map(s => {
                if (s.id !== subTaskId) return s;
                return { ...s, status: s.status === 'todo' ? 'done' : 'todo' };
            });
            return { ...t, subtasks: updatedSubtasks };
        }));
    };

    const deleteSubTask = (taskId, subTaskId) => {
        setTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            return { ...t, subtasks: t.subtasks.filter(s => s.id !== subTaskId) };
        }));
    };

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">任务看板</h2>
                    <p className="text-slate-400 text-sm">管理大任务及其子任务。进度由子任务自动决定。</p>
                </div>
                <div className="flex gap-2">
                    {/* Header Tools if needed */}
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                <Column
                    title="待办 (To Do)"
                    status="todo"
                    icon={Circle}
                    tasks={tasks}
                    categories={categories}
                    updateTaskStatus={updateTaskStatus}
                    deleteTask={deleteTask}
                    onScheduleTask={onScheduleTask}
                    handleAddTask={handleAddTask}
                    newTaskName={newTaskName}
                    setNewTaskName={setNewTaskName}
                    handleAddSubTask={handleAddSubTask}
                    toggleSubTaskStatus={toggleSubTaskStatus}
                    deleteSubTask={deleteSubTask}
                    newTaskCategory={newTaskCategory}
                    setNewTaskCategory={setNewTaskCategory}
                    allTasks={allTasks}
                    allPlans={allPlans}
                />
                <Column
                    title="进行中 (Doing)"
                    status="doing"
                    icon={Clock}
                    tasks={tasks}
                    categories={categories}
                    updateTaskStatus={updateTaskStatus}
                    deleteTask={deleteTask}
                    onScheduleTask={onScheduleTask}
                    handleAddSubTask={handleAddSubTask}
                    toggleSubTaskStatus={toggleSubTaskStatus}
                    deleteSubTask={deleteSubTask}
                    allTasks={allTasks}
                    allPlans={allPlans}
                />
                <Column
                    title="已完成 (Done)"
                    status="done"
                    icon={CheckCircle}
                    tasks={tasks}
                    categories={categories}
                    updateTaskStatus={updateTaskStatus}
                    deleteTask={deleteTask}
                    onScheduleTask={onScheduleTask}
                    handleAddSubTask={handleAddSubTask}
                    toggleSubTaskStatus={toggleSubTaskStatus}
                    deleteSubTask={deleteSubTask}
                    allTasks={allTasks}
                    allPlans={allPlans}
                />
            </div>
        </div>
    );
};

export default TaskBoard;
