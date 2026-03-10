import React, { useState, useEffect } from 'react';
import { ChevronRight, Dumbbell, Calendar as CalendarIcon, Save, Trash2 } from 'lucide-react';

const FITNESS_DAYS = [
    { id: 'chest', name: '胸部 (Chest)', exercises: ['平板卧推', '上斜哑铃卧推', '下斜卧推', '蝴蝶机夹胸', '绳索飞鸟', '器械推胸', '俯卧撑'] },
    { id: 'back', name: '背部 (Back)', exercises: ['引体向上', '高位下拉', '杠铃划船', '坐姿划船', '单臂哑铃划船', '直臂下拉', '硬拉'] },
    { id: 'legs', name: '腿部 (Legs)', exercises: ['深蹲', '倒蹬', '腿屈伸', '腿弯举', '罗马尼亚硬拉', '保加利亚分腿蹲', '提踵'] },
    { id: 'shoulders', name: '肩部 (Shoulders)', exercises: ['杠铃推举', '哑铃侧平举', '坐姿哑铃推举', '反向飞鸟', '前平举', '面拉'] },
    { id: 'arms', name: '手臂 (Arms)', exercises: ['杠铃弯举', '哑铃交替弯举', '绳索下压', '颈后臂屈伸', '牧师椅弯举', '锤式弯举'] },
    { id: 'core', name: '核心 (Core)', exercises: ['卷腹', '平板支撑', '俄罗斯挺身', '悬垂举腿', '健腹轮'] },
];

const EMOJI_FEELINGS = [
    { id: 1, emoji: '🤩', label: '极好 (状态拉满)' },
    { id: 2, emoji: '🙂', label: '良好 (正常完成)' },
    { id: 3, emoji: '😐', label: '一般 (有些吃力)' },
    { id: 4, emoji: '😫', label: '艰难 (力竭/变形)' },
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
    const [form, setForm] = useState({
        exercise: '',
        weight: '',
        reps: '',
        feeling: 1,
    });

    const today = toLocalDateString(new Date());

    useEffect(() => {
        const saved = localStorage.getItem('timeflow_fitness_records');
        if (saved) {
            setRecords(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        const currentExercises = FITNESS_DAYS.find(d => d.id === selectedDay)?.exercises || [];
        if (currentExercises.length > 0 && !currentExercises.includes(form.exercise)) {
            setForm(prev => ({ ...prev, exercise: currentExercises[0] }));
        }
    }, [selectedDay]);

    const saveRecords = (newRecords) => {
        setRecords(newRecords);
        localStorage.setItem('timeflow_fitness_records', JSON.stringify(newRecords));
    };

    const handleAddRecord = () => {
        if (!form.exercise || !form.weight || !form.reps) {
            alert('请完整填写重量和次数/组数');
            return;
        }

        const newRecord = {
            id: generateId(),
            date: today,
            dayType: selectedDay,
            exercise: form.exercise,
            weight: form.weight,
            reps: form.reps,
            feeling: form.feeling,
            timestamp: new Date().toISOString()
        };

        saveRecords([newRecord, ...records]);
        setForm(prev => ({ ...prev, reps: '', feeling: 1 }));
    };

    const deleteRecord = (id) => {
        if (confirm('确定删除这条记录吗？')) {
            saveRecords(records.filter(r => r.id !== id));
        }
    };

    const todayRecords = records.filter(r => r.date === today);

    return (
        <div className="pb-20 pt-6 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Dumbbell size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">身材管理</h1>
                    <p className="text-slate-500 font-medium">记录你的力量训练与感受</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
                            今日训练录入
                        </h2>

                        <div className="space-y-5">
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

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">2. 选择动作</label>
                                <div className="relative">
                                    <select
                                        value={form.exercise}
                                        onChange={(e) => setForm({ ...form, exercise: e.target.value })}
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

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">重量 (kg)</label>
                                    <input
                                        type="number"
                                        value={form.weight}
                                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                        placeholder="如: 60"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">次数</label>
                                    <input
                                        type="number"
                                        value={form.reps}
                                        onChange={(e) => setForm({ ...form, reps: e.target.value })}
                                        placeholder="如: 12"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono font-bold"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">3. 本组状态</label>
                                <div className="flex gap-2 justify-between">
                                    {EMOJI_FEELINGS.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setForm({ ...form, feeling: f.id })}
                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 ${form.feeling === f.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-105 shadow-sm'
                                                    : 'border-transparent bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900'
                                                }`}
                                            title={f.label}
                                        >
                                            <span className="text-3xl filter hover:brightness-110 transition-all">{f.emoji}</span>
                                            <span className={`text-[10px] mt-1 font-bold ${form.feeling === f.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                                {f.label.split(' ')[0]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleAddRecord}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    <Save size={20} />
                                    记录完成1组
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <CalendarIcon size={20} className="text-indigo-500" />
                                今日记录列表 <span className="text-slate-400 font-mono text-sm ml-2">{today}</span>
                            </h2>
                            <div className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-400 px-4 py-1.5 rounded-full shadow-sm">
                                已完成 {todayRecords.length} 组
                            </div>
                        </div>

                        {todayRecords.length === 0 ? (
                            <div className="h-72 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <Dumbbell size={64} strokeWidth={1} className="mb-4 text-slate-300 dark:text-slate-600" />
                                <p className="font-medium text-slate-500">今天还没有训练记录，开始挥洒汗水吧！</p>
                                <p className="text-sm mt-2 text-slate-400">选择左侧部位和动作，记录每一组的表现。</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todayRecords.map((record, idx) => {
                                    const dayName = FITNESS_DAYS.find(d => d.id === record.dayType)?.name.split(' ')[0] || record.dayType;
                                    const emoji = EMOJI_FEELINGS.find(f => f.id === record.feeling)?.emoji || '⚡';

                                    return (
                                        <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-2xl border border-slate-100 dark:border-slate-600">
                                                    {emoji}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-lg">
                                                        {record.exercise}
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            {dayName}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-slate-500 mt-1 font-mono flex items-center gap-2">
                                                        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-lg font-bold">
                                                            {record.weight}
                                                            <span className="text-[10px] ml-0.5 text-indigo-500/70">kg</span>
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-600">×</span>
                                                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-lg font-bold">
                                                            {record.reps}
                                                            <span className="text-[10px] ml-0.5 text-emerald-500/70">次</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => deleteRecord(record.id)}
                                                className="p-3 bg-white dark:bg-slate-800 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all opacity-0 group-hover:opacity-100"
                                                title="删除记录"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {records.length > todayRecords.length && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col items-center">
                                <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400">
                                    历史上共有 {records.length - todayRecords.length} 条其它日期的训练记录
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
