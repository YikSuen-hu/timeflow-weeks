import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, PictureInPicture2 } from 'lucide-react';

const TodoList = ({ todos, setTodos, togglePiP, isPiPActive }) => {
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
        <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 w-full ${isPiPActive ? 'h-full border-0 shadow-none p-0' : ''}`}>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-indigo-500" />
                    小便签 (To-Do)
                </div>
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
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                    type="submit"
                    disabled={!newTodo.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg disabled:opacity-50 transition-all"
                >
                    <Plus size={18} />
                </button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {activeTodos.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-4">暂无待办</div>
                ) : (
                    activeTodos.map(todo => (
                        <div key={todo.id} className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                    onClick={() => toggleTodo(todo.id)}
                                    className="text-slate-400 hover:text-indigo-500 transition-colors"
                                >
                                    <Circle size={18} />
                                </button>
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{todo.text}</span>
                            </div>
                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TodoList;
