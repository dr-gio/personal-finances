
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Transaction, Category, Budget, Debt, Obligation } from '../types';
import { analyzeFinances, chatWithFinances } from '../services/geminiService';

interface ExpenseAnalysisProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  debts: Debt[];
  obligations: Obligation[];
  currency: string;
  geminiApiKey?: string;
}

const ExpenseAnalysis: React.FC<ExpenseAnalysisProps> = ({ transactions, categories, budgets, debts, obligations, currency, geminiApiKey }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());

  // Filtrar transacciones por periodo
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const yearMatch = d.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === 'all' ? true : d.getMonth() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Estadísticas básicas
  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'debt_payment').reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const daysInPeriod = selectedMonth === 'all' ? 365 : new Date(selectedYear, (selectedMonth as number) + 1, 0).getDate();
    const dailyAvg = expense / daysInPeriod;

    const catTotals = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    let maxCatId = '';
    let maxVal = 0;
    Object.entries(catTotals).forEach(([id, val]) => {
      const numericVal = val as number;
      if (numericVal > maxVal) {
        maxVal = numericVal;
        maxCatId = id;
      }
    });

    return {
      income,
      expense,
      savingsRate: Math.max(0, savingsRate),
      dailyAvg,
      topCategory: categories.find(c => c.id === maxCatId)?.name || 'N/A'
    };
  }, [filteredTransactions, categories]);

  // Datos para gráfico de barras (Categorías)
  const barData = useMemo(() => {
    return categories.map(cat => {
      const total = filteredTransactions
        .filter(t => t.categoryId === cat.id && (t.type === 'expense' || t.type === 'debt_payment'))
        .reduce((s, t) => s + t.amount, 0);
      return { name: cat.name, amount: total, color: cat.color };
    }).filter(d => d.amount > 0).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories]);

  // Datos para gráfico de área (Tendencia)
  const trendData = useMemo(() => {
    if (selectedMonth === 'all') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return months.map((monthName, idx) => {
        const exp = filteredTransactions
          .filter(t => new Date(t.date).getMonth() === idx && (t.type === 'expense' || t.type === 'debt_payment'))
          .reduce((s, t) => s + t.amount, 0);
        const inc = filteredTransactions
          .filter(t => new Date(t.date).getMonth() === idx && t.type === 'income')
          .reduce((s, t) => s + t.amount, 0);
        return { date: monthName, Gastos: exp, Ingresos: inc, Balance: inc - exp };
      });
    } else {
      const lastDay = new Date(selectedYear, (selectedMonth as number) + 1, 0).getDate();
      const days = Array.from({ length: lastDay }, (_, i) => i + 1);

      return days.map(day => {
        const datePrefix = `${selectedYear}-${String((selectedMonth as number) + 1).padStart(2, '0')}`;
        const dateStr = `${datePrefix}-${String(day).padStart(2, '0')}`;
        const exp = filteredTransactions
          .filter(t => t.date === dateStr && (t.type === 'expense' || t.type === 'debt_payment'))
          .reduce((s, t) => s + t.amount, 0);
        const inc = filteredTransactions
          .filter(t => t.date === dateStr && t.type === 'income')
          .reduce((s, t) => s + t.amount, 0);
        return { date: day.toString(), Gastos: exp, Ingresos: inc, Balance: inc - exp };
      });
    }
  }, [filteredTransactions, selectedMonth, selectedYear]);

  const handleGenerateAiInsight = async () => {
    setIsAnalyzing(true);
    try {
      const insight = await analyzeFinances({
        transactions,
        budgets,
        debts,
        currency,
        apiKey: geminiApiKey
      });
      setAiInsight(insight || "No hay suficientes datos para un análisis profundo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || !geminiApiKey) return;

    setIsAnalyzing(true);
    try {
      const result = await chatWithFinances(customQuery, {
        transactions,
        budgets,
        debts,
        obligations,
        currency,
        apiKey: geminiApiKey
      });
      setAiInsight(result);
      setCustomQuery('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Análisis Financiero</h2>
          <p className="text-slate-600 font-medium">Radiografía completa de tus finanzas personales</p>
        </div>

        <div className="flex items-center bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-200 min-w-[320px]">
          <div className="pl-4 pr-2 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="flex-1 bg-transparent px-2 py-2 font-black text-xs uppercase tracking-widest outline-none border-none cursor-pointer text-slate-700"
          >
            <option value="all">Año Completo</option>
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <div className="h-4 w-px bg-slate-200 mx-2"></div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent px-4 py-2 font-black text-xs uppercase tracking-widest outline-none border-none cursor-pointer text-slate-700"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </header>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tasa de Ahorro</p>
          <p className="text-3xl font-black text-indigo-600">{stats.savingsRate.toFixed(1)}%</p>
          <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${stats.savingsRate}%` }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gasto Diario Prom.</p>
          <p className="text-3xl font-black text-slate-900">{currency}{stats.dailyAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mayor Categoría</p>
          <p className="text-3xl font-black text-rose-500 truncate" title={stats.topCategory}>{stats.topCategory}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Periodo</p>
          <p className={`text-3xl font-black ${stats.income >= stats.expense ? 'text-emerald-500' : 'text-rose-600'}`}>
            {currency}{(stats.income - stats.expense).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center justify-between">
            <span className="flex items-center gap-2"><span>📈</span> Tendencia {selectedMonth === 'all' ? 'del Año' : 'del Mes'}</span>
            <span className="text-[10px] text-slate-400 font-bold">{selectedMonth === 'all' ? 'Vista Mensual' : 'Vista Diaria'}</span>
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                />
                <Area type="monotone" dataKey="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                <Area type="monotone" dataKey="Gastos" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-2">
            <span>🏷️</span> Gastos por Categoría
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }} width={100} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                />
                <Bar dataKey="amount" radius={[0, 10, 10, 0]} barSize={24}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Asesor Financiero IA */}
      <section className="bg-slate-900 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <h3 className="text-3xl font-black text-white tracking-tight">Tu Asesor Personal</h3>
              </div>
              <p className="text-slate-400 font-medium text-sm">Tu IA conoce todos tus movimientos, deudas y presupuestos. Pregúntale cualquier cosa.</p>
            </div>

            <form onSubmit={handleAskAi} className="space-y-4">
              <div className="bg-[#0f172a] border-2 border-slate-700 p-5 rounded-[2rem] focus-within:border-indigo-400 transition-all shadow-xl">
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="¿En qué puedo mejorar mis gastos?"
                  className="w-full bg-transparent border-none outline-none text-white text-lg font-bold resize-none h-32 placeholder:text-slate-500"
                  style={{ color: 'white', opacity: 1 }}
                />
              </div>
              <button
                type="submit"
                disabled={isAnalyzing || !customQuery.trim()}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                💬 Consultar al Asesor
              </button>
            </form>

            <button
              onClick={handleGenerateAiInsight}
              className="text-indigo-400 font-black uppercase tracking-widest text-[10px] py-4 border border-indigo-500/30 rounded-2xl hover:bg-indigo-500/10 transition-all"
            >
              🚀 Auditoría Financiera Completa
            </button>
          </div>

          <div className="flex-1 min-h-[400px]">
            {isAnalyzing ? (
              <div className="h-full bg-white/5 p-8 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center gap-4 py-12">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-indigo-400 font-black uppercase tracking-widest text-xs animate-pulse">Procesando consulta financiera...</p>
              </div>
            ) : aiInsight ? (
              <div className="h-full bg-white p-10 rounded-[3rem] border border-indigo-500/30 text-slate-800 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Respuesta del Asesor 440</span>
                  <button onClick={() => setAiInsight(null)} className="text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase">Borrar</button>
                </div>
                <div className="text-sm leading-relaxed prose prose-slate max-w-none max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                  {aiInsight.split('\n').map((line, i) => (
                    <p key={i} className="mb-3 last:mb-0 font-medium text-slate-700">{line}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full bg-white/5 p-12 rounded-[3rem] border border-white/5 border-dashed flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-6xl opacity-20">📊</div>
                <h4 className="text-indigo-400 font-black uppercase tracking-widest text-xs">Sin consulta activa</h4>
                <p className="text-slate-500 text-sm max-w-xs font-medium">Usa el campo de la izquierda para preguntar sobre tus ahorros, deudas o próximos pagos.</p>
              </div>
            )}
          </div>
        </div>

        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </section>
    </div>
  );
};

export default ExpenseAnalysis;
