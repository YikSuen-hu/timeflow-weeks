import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Dumbbell, Calendar as CalendarIcon, Save, Trash2, Plus, X, BarChart2, Flame, Target, Activity } from 'lucide-react';

const FITNESS_DAYS = [
    { id: 'chest', name: '胸部 (Chest)', exercises: ['平板卧推', '上斜哑铃卧推', '下斜卧推', '蝴蝶机夹胸', '绳索飞鸟', '器械推胸', '俯卧撑'] },
    { id: 'back', name: '背部 (Back)', exercises: ['引体向上', '高位下拉', '杠铃划船', '坐姿划船', '单臂哑铃划船', '直臂下拉', '硬拉'] },
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

const generateId = () => Math.random().toString(36).substr(2, 9);
const toLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function FitnessPage() {
    const [records, setRecords] = useState([]);
    const [selectedDay, setSelectedDay] = useState(FITNESS_DAYS[0].id);
    const [exercise, setExercise] = useState('');
    const [sets, setSets] = useState([{ id: generateId(), weight: '', reps: '', feeling: 1 }]);

    const today = toLocalDateString(new Date());

    useEffect(() => {
        const saved = localStorage.getItem('timeflow_fitness_records');
        if (saved) {
            setRecords(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        const currentExercises = FITNESS_DAYS.find(d => d.id === selectedDay)?.exercises || [];
        if (currentExercises.length > 0 && !currentExercises.includes(exercise)) {
            setExercise(currentExercises[0]);
        }
    }, [selectedDay]);

    const saveRecords = (newRecords) => {
        setRecords(newRecords);
        localStorage.setItem('timeflow_fitness_records', JSON.stringify(newRecords));
    };

    const handleAddSet = () => {
        const lastSet = sets[sets.length - 1];
        setSets([...sets, {
            id: generateId(),
            weight: lastSet ? lastSet.weight : '',
            reps: lastSet ? lastSet.reps : '',
            feeling: lastSet ? lastSet.feeling : 1
        }]);
    };

    const handleRemoveSet = (id) => {
        if (sets.length > 1) {
            setSets(sets.filter(s => s.id !== id));
        }
    };

    const updateSet = (id, field, value) => {
        setSets(sets.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSaveRecord = () => {
        const invalid = sets.some(s => !s.weight || !s.reps);
        if (invalid || !exercise) {
            alert('请完整填写所有组的重量和次数');
            return;
        }

        const newRecord = {
            id: generateId(),
            date: today,
            dayType: selectedDay,
            exercise: exercise,
            sets: sets.map(s => ({ ...s })),
            timestamp: new Date().toISOString()
        };

        saveRecords([newRecord, ...records]);
        setSets([{ id: generateId(), weight: '', reps: '', feeling: 1 }]);
    };

    const deleteRecord = (id) => {
        if (confirm('确定删除这个动作的所有记录吗？')) {
            saveRecords(records.filter(r => r.id !== id));
        }
    };

    const todayRecords = records.filter(r => r.date === today);
    const totalSetsToday = todayRecords.reduce((acc, curr) => acc + (curr.sets ? curr.sets.length : 1), 0);

    const summary = useMemo(() => {
        if (todayRecords.length === 0) return null;

        const muscles = new Set(todayRecords.map(r => r.dayType));
        const targetMuscles = Array.from(muscles).map(id => FITNESS_DAYS.find(d => d.id === id)?.name.split(' ')[0] || id).join(', ');

        let totalVolume = 0;
        let totalFeelingScore = 0;

        todayRecords.forEach(record => {
            const sets = record.sets || [{ weight: record.weight, reps: record.reps, feeling: record.feeling }];
            sets.forEach(set => {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                totalVolume += weight * reps;
                totalFeelingScore += (set.feeling || 3);
            });
        });

        const avgFeelingId = Math.round(totalFeelingScore / totalSetsToday);
        const dominantEmoji = EMOJI_FEELINGS.find(f => f.id === Math.max(1, Math.min(5, avgFeelingId)));

        return {
            targetMuscles,
            totalExercises: todayRecords.length,
            totalSets: totalSetsToday,
            totalVolume,
            statusLabel: dominantEmoji?.label.split(' ')[0] || '一般',
            statusEmoji: dominantEmoji?.emoji || '😐'
        };
    }, [todayRecords, totalSetsToday]);

    return (
        <div className="pb-20 pt-6 px-4 md:px-5 max-w-[1100px] mx-auto min-h-screen animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Dumbbell size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">身材管理</h1>
                    <p className="text-slate-500 font-medium">记录你的力量训练与感受</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-5 lg:gap-6">
                {/* Left Form */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-5 order-2 lg:order-1">
                    <div className="bg-white dark:bg-slate-800 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h2 className="text-[17px] font-bold text-slate-700 dark:text-slate-200 mb-5 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block shadow-sm"></span>
                            今日训练录入
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">1. 训练部位</label>
                                <div className="flex flex-wrap gap-2">
                                    {FITNESS_DAYS.map(day => (
                                        <button
                                            key={day.id}
                                            onClick={() => setSelectedDay(day.id)}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-300 ${selectedDay === day.id
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/40 scale-105'
                                                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {day.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">2. 选择动作</label>
                                <div className="relative">
                                    <select
                                        value={exercise}
                                        onChange={(e) => setExercise(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-bold appearance-none cursor-pointer"
                                    >
                                        {FITNESS_DAYS.find(d => d.id === selectedDay)?.exercises.map(ex => (
                                            <option key={ex} value={ex}>{ex}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">3. 训练组计划</label>
                                <div className="flex flex-col gap-3">
                                    {sets.map((set, idx) => (
                                        <div key={set.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl relative group transition-all">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-indigo-500 dark:text-indigo-400 text-sm bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">第 {idx + 1} 组</span>
                                                {sets.length > 1 && (
                                                    <button onClick={() => handleRemoveSet(set.id)} className="text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 p-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-700 transition-colors" title="删除本组">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <input
                                                        type="number"
                                                        placeholder="重量(kg)"
                                                        value={set.weight}
                                                        onChange={e => updateSet(set.id, 'weight', e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono font-bold text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        placeholder="次数"
                                                        value={set.reps}
                                                        onChange={e => updateSet(set.id, 'reps', e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between gap-1">
                                                {EMOJI_FEELINGS.map(f => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => updateSet(set.id, 'feeling', f.id)}
                                                        className={`flex-1 py-1.5 rounded-lg border flex justify-center text-xl transition-all ${set.feeling === f.id ? 'bg-white dark:bg-slate-800 border-indigo-400 shadow-sm scale-110 z-10' : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm opacity-60 hover:opacity-100'}`}
                                                        title={f.label}
                                                        type="button"
                                                    >
                                                        {f.emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <button onClick={handleAddSet} type="button" className="py-3 mt-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all font-bold">
                                        <Plus size={18} /> 添加一组
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={handleSaveRecord}
                                    type="button"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    <Save size={20} />
                                    记录完成 {sets.length} 组
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle List */}
                <div className="lg:col-span-7 xl:col-span-5 space-y-5 order-3 lg:order-2">
                    <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[28px] p-4 md:p-5 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[500px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                                <CalendarIcon size={24} className="text-indigo-500" />
                                今日记录列表 <span className="text-slate-400 font-mono text-sm ml-2 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full">{today}</span>
                            </h2>
                            <div className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-400 px-4 py-2 rounded-full shadow-sm">
                                今日已完成 {totalSetsToday} 组
                            </div>
                        </div>

                        {todayRecords.length === 0 ? (
                            <div className="h-72 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <Dumbbell size={64} strokeWidth={1} className="mb-4 text-slate-300 dark:text-slate-600" />
                                <p className="font-medium text-slate-500">今天还没有训练记录，开始挥洒汗水吧！</p>
                                <p className="text-sm mt-2 text-slate-400">选择左侧部位和动作，记录每一组的表现。</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {todayRecords.map((record, idx) => {
                                    const dayName = FITNESS_DAYS.find(d => d.id === record.dayType)?.name.split(' ')[0] || record.dayType;
                                    const displaySets = record.sets ? record.sets : [{ id: record.id + '_legacy', weight: record.weight, reps: record.reps, feeling: record.feeling }];

                                    return (
                                        <div key={record.id} className="mb-5 p-4 md:p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 transition-all hover:shadow-md group">
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                                                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base md:text-lg">
                                                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full shadow-sm"></div>
                                                    {record.exercise}
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md uppercase ml-1.5">
                                                        {dayName}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => deleteRecord(record.id)}
                                                    className="p-1.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600 transition-all opacity-0 group-hover:opacity-100"
                                                    title="删除此锻炼项目"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap border-2 border-slate-100 dark:border-slate-700/60 rounded-2xl bg-slate-50 dark:bg-slate-800/40 overflow-hidden divide-x-2 divide-slate-100 dark:divide-slate-700/60">
                                                {displaySets.map((set, setIdx) => {
                                                    const emojiFeeling = EMOJI_FEELINGS.find(f => f.id === set.feeling);
                                                    const emoji = emojiFeeling?.emoji || '⚡';
                                                    const emojiLabel = emojiFeeling?.label.split(' ')[0] || '';

                                                    return (
                                                        <div key={set.id} className="flex-1 min-w-[90px] p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-white dark:hover:bg-slate-700/50 transition-colors">
                                                            <div className="text-slate-400 font-mono text-[9px] font-extrabold uppercase tracking-widest opacity-80 mb-0.5">
                                                                #{setIdx + 1}
                                                            </div>

                                                            <div className="font-mono flex items-baseline justify-center gap-1 w-full pt-0.5">
                                                                <span className="text-[15px] font-bold text-indigo-600 dark:text-indigo-400">{set.weight}</span>
                                                                <span className="text-[9px] text-slate-400">kg</span>
                                                                <span className="text-slate-300 dark:text-slate-600 text-xs mx-0.5">×</span>
                                                                <span className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">{set.reps}</span>
                                                                <span className="text-[9px] text-slate-400">次</span>
                                                            </div>

                                                            <div className="flex items-center justify-center gap-1 w-full mt-1">
                                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{emojiLabel}</span>
                                                                <span className="text-sm drop-shadow-sm leading-none ml-1" title={emojiFeeling?.label}>{emoji}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {records.length > todayRecords.length && (
                            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center">
                                <div className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 shadow-inner">
                                    历史上共有 {records.length - todayRecords.length} 项其它的训练记录
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Summary */}
                <div className="lg:col-span-12 xl:col-span-3 space-y-5 order-1 lg:order-3">
                    {summary && (
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[28px] p-5 xl:p-6 shadow-md shadow-indigo-500/20 text-white relative overflow-hidden xl:sticky xl:top-6">
                            <div className="absolute -right-6 -top-6 opacity-10">
                                <BarChart2 size={140} strokeWidth={3} />
                            </div>

                            <h2 className="text-[17px] font-bold mb-5 flex items-center gap-2 opacity-95">
                                <Activity size={20} className="opacity-90" />
                                今日训练速览
                            </h2>

                            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-1 gap-3.5 relative z-10">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                                    <div className="text-indigo-100 text-[11px] font-bold mb-1.5 flex items-center gap-1.5 opacity-80 uppercase tracking-wider">
                                        <Target size={14} /> 训练部位
                                    </div>
                                    <div className="font-extrabold text-lg truncate" title={summary.targetMuscles}>
                                        {summary.targetMuscles}
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                                    <div className="text-indigo-100 text-[11px] font-bold mb-1.5 flex items-center gap-1.5 opacity-80 uppercase tracking-wider">
                                        <Dumbbell size={14} /> 训练总量
                                    </div>
                                    <div className="font-extrabold text-lg">
                                        {summary.totalExercises} <span className="text-xs font-normal opacity-80">动作</span>
                                        <div className="h-0.5 xl:h-1"></div>
                                        {summary.totalSets} <span className="text-xs font-normal opacity-80">组</span>
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                                    <div className="text-indigo-100 text-[11px] font-bold mb-1.5 flex items-center gap-1.5 opacity-80 uppercase tracking-wider">
                                        <Flame size={14} /> 训练总容量
                                    </div>
                                    <div className="font-extrabold text-xl flex items-baseline gap-1">
                                        {summary.totalVolume.toLocaleString()} <span className="text-xs font-normal opacity-70">kg</span>
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                                    <div className="text-indigo-100 text-[11px] font-bold mb-1.5 flex items-center gap-1.5 opacity-80 uppercase tracking-wider">
                                        今日状态
                                    </div>
                                    <div className="font-extrabold text-xl flex items-center gap-2.5">
                                        <span className="text-3xl drop-shadow-md leading-none">{summary.statusEmoji}</span>
                                        <span className="text-base">{summary.statusLabel}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
