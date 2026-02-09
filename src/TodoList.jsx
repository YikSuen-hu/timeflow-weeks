import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, PictureInPicture2 } from 'lucide-react';

const TodoList = ({ todos, setTodos, togglePiP, isPiPActive, timerStr, currentTaskName }) => {
    const [newTodo, setNewTodo] = useState('');

    const handleAddTodo = (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        const todo = {
            id: Date.now().toString(),
            text: newTodo,
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString()
        };
        setTodos([todo, ...todos]);
        setNewTodo('');
    };

    const toggleTodo = (id) => {
        setTodos(todos.map(t => {
            if (t.id !== id) return t;
            return {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? new Date().toISOString() : null
            };
        }));
    };

    const deleteTodo = (id) => {
        setTodos(todos.filter(t => t.id !== id));
    };

    const activeTodos = todos.filter(t => !t.completed);

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 w-full 
            ${isPiPActive ? 'h-full border-0 shadow-none p-2' : 'p-6'}`}>
            <h3 className={`font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between
                ${isPiPActive ? 'text-sm mb-2' : 'text-lg mb-4'}`}>
                <div className="flex items-center gap-2">
                    <CheckCircle size={isPiPActive ? 16 : 20} className="text-indigo-500" />
                    小便签 (To-Do)
                </div>

                {isPiPActive && timerStr && (
                    <div className="flex flex-col items-end leading-none">
                        <span className="font-mono font-bold text-xl text-indigo-600 dark:text-indigo-400">{timerStr}</span>
                        {currentTaskName && <span className="text-[10px] text-slate-400 max-w-[100px] truncate">{currentTaskName}</span>}
                    </div>
                )}

                {!isPiPActive && window.documentPictureInPicture && togglePiP && (
                    <button
                        onClick={togglePiP}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                        title="独立悬浮窗"
                    >
                        <PictureInPicture2 size={16} />
                    </button>
                )}
            </h3>

            <form onSubmit={handleAddTodo} className="relative mb-4">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="添加待办事项..."
                    className={`w-full bg-slate-50 dark:bg-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all
                        ${isPiPActive ? 'pl-2 pr-8 py-1.5 text-xs' : 'pl-4 pr-10 py-3 text-sm'}`}
                />
                <button
                    type="submit"
                    disabled={!newTodo.trim()}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg disabled:opacity-50 transition-all
                         ${isPiPActive ? 'p-0.5' : 'p-1.5'}`}
                >
                    <Plus size={isPiPActive ? 14 : 18} />
                </button>
            </form>

            <div className={`space-y-2 overflow-y-auto custom-scrollbar pr-1 ${isPiPActive ? 'max-h-[calc(100vh-80px)] space-y-1' : 'max-h-[300px]'}`}>
                {activeTodos.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-4">暂无待办</div>
                ) : (
                    activeTodos.map(todo => (
                        <div key={todo.id} className={`group flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all
                            ${isPiPActive ? 'p-1.5' : 'p-3'}`}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <button
                                    onClick={() => toggleTodo(todo.id)}
                                    className="text-slate-400 hover:text-indigo-500 transition-colors flex-shrink-0"
                                >
                                    <Circle size={isPiPActive ? 14 : 18} />
                                </button>
                                <span className={`text-slate-700 dark:text-slate-300 truncate ${isPiPActive ? 'text-xs' : 'text-sm'}`}>{todo.text}</span>
                            </div>
                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                            >
                                <Trash2 size={isPiPActive ? 12 : 14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TodoList;
