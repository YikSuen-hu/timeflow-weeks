import React, { useState } from 'react';
import { Plus, MoreHorizontal, Calendar, Trash2, ArrowRight, CheckCircle, Circle, Clock } from 'lucide-react';

const TaskBoard = ({ tasks, setTasks, categories, onScheduleTask }) => {
    // Columns: 'todo', 'doing', 'done'
    // Task Structure: { id, name, status: 'todo'|'doing'|'done', categoryId, estimatedDuration: 3600 }

    const [newTaskName, setNewTaskName] = useState('');

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;
        const newTask = {
            id: Date.now().toString(),
            name: newTaskName,
            status: 'todo',
            categoryId: categories[0].id,
            estimatedDuration: 3600, // Default 1 hour
            createdAt: new Date().toISOString()
        };
        setTasks([...tasks, newTask]);
        setNewTaskName('');
    };

    const updateTaskStatus = (taskId, newStatus) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    };

    const deleteTask = (taskId) => {
        if (confirm('确定要删除这个任务吗？')) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    const getCategoryColor = (id) => {
        const cat = categories.find(c => c.id === id) || { color: '#cbd5e1' };
        return cat.color;
    };

    const Column = ({ title, status, icon: Icon }) => {
        const columnTasks = tasks.filter(t => t.status === status);

        return (
            <div className="flex-1 min-w-[300px] flex flex-col h-full bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm">
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
                        <div key={task.id} className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-fade-in-up">
                            <div className="flex justify-between items-start mb-2">
                                <span
                                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                    style={{ backgroundColor: getCategoryColor(task.categoryId) }}
                                ></span>
                                <div className="flex-1 mx-3 font-medium text-slate-700 dark:text-slate-200 break-words leading-tight">
                                    {task.name}
                                </div>
                                <div className="relative group/menu">
                                    <button className="text-slate-300 hover:text-slate-500 transition-colors p-1">
                                        <MoreHorizontal size={16} />
                                    </button>
                                    {/* Dropdown Menu for Quick Actions */}
                                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 py-1 hidden group-hover/menu:block z-20">
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                                        >
                                            <Trash2 size={12} /> 删除
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                                <div className="flex gap-1">
                                    {/* Status Movers */}
                                    {status !== 'todo' && (
                                        <button
                                            onClick={() => updateTaskStatus(task.id, 'todo')}
                                            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Move to Todo"
                                        >
                                            <Circle size={14} />
                                        </button>
                                    )}
                                    {status !== 'doing' && (
                                        <button
                                            onClick={() => updateTaskStatus(task.id, 'doing')}
                                            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Move to Doing"
                                        >
                                            <Clock size={14} />
                                        </button>
                                    )}
                                    {status !== 'done' && (
                                        <button
                                            onClick={() => updateTaskStatus(task.id, 'done')}
                                            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Move to Done"
                                        >
                                            <CheckCircle size={14} />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => onScheduleTask(task)}
                                    className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                    <Calendar size={14} />
                                    调度
                                </button>
                            </div>
                        </div>
                    ))}

                    {status === 'todo' && (
                        <form onSubmit={handleAddTask} className="mt-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newTaskName}
                                    onChange={(e) => setNewTaskName(e.target.value)}
                                    placeholder="添加新任务..."
                                    className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
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
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">任务看板</h2>
                    <p className="text-slate-400 text-sm">管理您的待办事项，并将其调度到时间轴执行。</p>
                </div>
                <div className="flex gap-2">
                    {/* Header Tools if needed */}
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                <Column title="待办 (To Do)" status="todo" icon={Circle} />
                <Column title="进行中 (Doing)" status="doing" icon={Clock} />
                <Column title="已完成 (Done)" status="done" icon={CheckCircle} />
            </div>
        </div>
    );
};

export default TaskBoard;
