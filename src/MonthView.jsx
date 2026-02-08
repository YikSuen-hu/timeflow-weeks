import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const MonthView = ({ todos }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Adjust firstDay to Monday-based (0=Mon, 6=Sun) instead of Sunday-based (0=Sun, 6=Sat)
    // Standard JS getDay(): 0=Sun, 1=Mon ... 6=Sat
    // We want: 0=Mon ... 6=Sun
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    // Empty slots for days before start of month
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const getCompletedTodosForDate = (date) => {
        if (!date) return [];
        const dateString = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        return todos.filter(t => {
            if (!t.completedAt) return false;
            const completedDate = new Date(t.completedAt).toLocaleDateString('en-CA');
            return completedDate === dateString;
        });
    };

    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

    return (
        <div className="flex-1 h-full p-8 overflow-hidden flex flex-col animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-4">
                    <span>{year}年 {monthNames[month]}</span>
                    <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{year}-{String(month + 1).padStart(2, '0')}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="py-4 text-center font-bold text-slate-400 uppercase text-xs tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6">
                    {days.map((date, index) => {
                        if (!date) return <div key={`empty-${index}`} className="bg-slate-50/30 dark:bg-slate-800/20 border-r border-b border-slate-50 dark:border-slate-800/50"></div>;

                        const completedTodos = getCompletedTodosForDate(date);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <div key={index} className={`relative p-2 border-r border-b border-slate-100 dark:border-slate-800 group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {date.getDate()}
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar pr-1">
                                    {completedTodos.map(todo => (
                                        <div key={todo.id} className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50 truncate flex items-center gap-1">
                                            <CheckCircle size={8} className="flex-shrink-0" />
                                            <span className="truncate">{todo.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {/* Fill remaining cells if needed */}
                    {[...Array(42 - days.length)].map((_, i) => (
                        <div key={`end-empty-${i}`} className="bg-slate-50/30 dark:bg-slate-800/20 border-r border-b border-slate-50 dark:border-slate-800/50"></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MonthView;
