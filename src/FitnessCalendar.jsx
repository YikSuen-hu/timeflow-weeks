import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';

const FITNESS_DAYS = [
    { id: 'chest', name: '胸部 (Chest)', exercises: ['平板卧推', '上斜哑铃卧推', '下斜卧推', '蝴蝶机夹胸', '绳索飞鸟', '器械推胸', '俯卧撑'] },
    { id: 'back', name: '背部 (Back)', exercises: ['引体向上', '高位下拉', '杠铃划船', '坐姿划船', '坐姿V把划船', '单臂哑铃划船', '直臂下拉', '硬拉'] },
    { id: 'legs', name: '腿部 (Legs)', exercises: ['深蹲', '倒蹬', '腿屈伸', '腿弯举', '罗马尼亚硬拉', '保加利亚分腿蹲', '提踵'] },
    { id: 'shoulders', name: '肩部 (Shoulders)', exercises: ['杠铃推举', '哑铃侧平举', '坐姿哑铃推举', '反向飞鸟', '前平举', '面拉', '侧卧后束飞鸟'] },
    { id: 'arms', name: '手臂 (Arms)', exercises: ['杠铃弯举', '哑铃交替弯举', '绳索下压', '颈后臂屈伸', '牧师椅弯举', '锤式弯举'] },
    { id: 'core', name: '核心 (Core)', exercises: ['卷腹', '平板支撑', '俄罗斯挺身', '悬垂举腿', '健腹轮'] },
];

const EMOJI_FEELINGS = [
    { id: 1, emoji: '🤩', label: '极好 (状态拉满)' },
    { id: 2, emoji: '🙂', label: '良好 (正常完成)' },
    { id: 3, emoji: '😐', label: '一般 (有些吃力)' },
    { id: 4, emoji: '😫', label: '艰难 (极其吃力)' },
    { id: 5, emoji: '🥵', label: '极限 (完全透支)' },
];

const FitnessCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('fitnessRecords');
        if (saved) {
            try {
                setRecords(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load fitness records", e);
            }
        }
    }, [currentDate]);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const getDailySummary = (date) => {
        if (!date) return null;
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayRecords = records.filter(r => r.date === dateString);
        if (dayRecords.length === 0) return null;

        const totalSetsToday = dayRecords.reduce((acc, curr) => acc + (curr.sets ? curr.sets.length : 1), 0);
        const muscles = new Set(dayRecords.map(r => r.dayType));
        const targetMuscles = Array.from(muscles)
            .map(id => FITNESS_DAYS.find(d => d.id === id)?.name.split(' ')[0] || id)
            .join(', ');

        let totalFeelingScore = 0;

        dayRecords.forEach(record => {
            const sets = record.sets || [{ weight: record.weight, reps: record.reps, feeling: record.feeling }];
            sets.forEach(set => {
                totalFeelingScore += (set.feeling || 3);
            });
        });

        const avgFeelingId = Math.round(totalFeelingScore / totalSetsToday);
        const dominantEmoji = EMOJI_FEELINGS.find(f => f.id === Math.max(1, Math.min(5, avgFeelingId)))?.emoji || '😐';

        return {
            targetMuscles,
            totalSetsToday,
            dominantEmoji
        };
    };

    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

    return (
        <div className="flex-1 h-full py-8 px-4 md:px-8 overflow-hidden flex flex-col animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-4">
                    <span>{year}年 {monthNames[month]}运动报告</span>
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

            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden min-h-[600px]">
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

                        const summary = getDailySummary(date);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <div key={index} className={`relative p-3 border-r border-b border-slate-100 dark:border-slate-800 group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                <div className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${isToday ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {date.getDate()}
                                </div>

                                {summary && (
                                    <div className="flex-1 flex flex-col gap-1.5 justify-center overflow-hidden animate-fade-in mt-1">
                                        <div className="text-3xl drop-shadow-sm self-center my-1 group-hover:scale-110 transition-transform">
                                            {summary.dominantEmoji}
                                        </div>
                                        <div className="text-xs font-bold text-center text-slate-700 dark:text-slate-200 truncate px-1" title={summary.targetMuscles}>
                                            {summary.targetMuscles}
                                        </div>
                                        <div className="flex items-center justify-center gap-2 mt-auto pb-1">
                                            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Dumbbell size={10} /> {summary.totalSetsToday} 组
                                            </div>
                                        </div>
                                    </div>
                                )}
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

export default FitnessCalendar;
