
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { Transaction, Category, Budget, Debt } from '../types';
import { analyzeFinances } from '../services/geminiService';

interface ExpenseAnalysisProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  debts: Debt[];
  currency: string;
}

const ExpenseAnalysis: React.FC<ExpenseAnalysisProps> = ({ transactions, categories, budgets, debts, currency }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Estadísticas básicas
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' || t.type === 'debt_payment').reduce((s, t) => s + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const dailyAvg = expense / 30; // Aproximación mensual

    // Categoría más costosa
    const catTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    let maxCatId = '';
    let maxVal = 0;
    Object.entries(catTotals).forEach(([id, val]) => {
      if (val > maxVal) {
        maxVal = val;
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
  }, [transactions, categories]);

  // Datos para gráfico de barras (Categorías)
  const barData = useMemo(() => {
    return categories.map(cat => {
      const total = transactions
        .filter(t => t.categoryId === cat.id && (t.type === 'expense' || t.type === 'debt_payment'))
        .reduce((s, t) => s + t.amount, 0);
      return { name: cat.name, amount: total, color: cat.color };
    }).filter(d => d.amount > 0).sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  // Datos para gráfico de área (Tendencia)
  const trendData = useMemo(() => {
    const days = Array.from({ length: 15 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return days.map(date => {
      const exp = transactions
        .filter(t => t.date === date && (t.type === 'expense' || t.type === 'debt_payment'))
        .reduce((s, t) => s + t.amount, 0);
      const inc = transactions
        .filter(t => t.date === date && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      return { date: date.split('-')[2], Gastos: exp, Ingresos: inc };
    });
  }, [transactions]);

  const handleGenerateAiInsight = async () => {
    setIsAnalyzing(true);
    try {
      const insight = await analyzeFinances({
        transactions,
        budgets,
        debts,
        currency
      });
      setAiInsight(insight || "No hay suficientes datos para un análisis profundo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Análisis de Gastos</h2>
        <p className="text-slate-600 font-medium">Radiografía completa de tus finanzas personales</p>
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
          <p className="text-3xl font-black text-slate-900">{currency}{stats.dailyAvg.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mayor Categoría</p>
          <p className="text-3xl font-black text-rose-500 truncate" title={stats.topCategory}>{stats.topCategory}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance del Mes</p>
          <p className={`text-3xl font-black ${stats.income >= stats.expense ? 'text-emerald-500' : 'text-rose-600'}`}>
            {currency}{(stats.income - stats.expense).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Tendencia */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-2">
            <span>📈</span> Tendencia últimos 15 días
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800}}
                />
                <Area type="monotone" dataKey="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                <Area type="monotone" dataKey="Gastos" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por Categorías */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight flex items-center gap-2">
            <span>🏷️</span> Gastos por Categoría
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 800}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800}}
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

      {/* Auditoría de IA */}
      <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-4">
            <h3 className="text-3xl font-black text-white tracking-tight">Auditoría Financiera IA</h3>
            <p className="text-slate-400 font-medium">¿Quieres saber cómo optimizar tu dinero? Deja que nuestra inteligencia analice tus patrones de consumo.</p>
            {!aiInsight && !isAnalyzing && (
              <button 
                onClick={handleGenerateAiInsight}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
              >
                🚀 Iniciar Análisis con Gemini
              </button>
            )}
          </div>
          <div className="w-full md:w-2/3">
             {isAnalyzing ? (
               <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center gap-4 py-12">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-400 font-black uppercase tracking-widest text-xs animate-pulse">Analizando tus movimientos...</p>
               </div>
             ) : aiInsight ? (
               <div className="bg-white p-8 rounded-[2rem] border border-indigo-500/30 text-slate-800 prose prose-slate prose-invert max-w-none max-h-[400px] overflow-y-auto scrollbar-hide">
                 <div className="flex justify-between items-center mb-4">
                   <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Recomendaciones de Gemini</span>
                   <button onClick={() => setAiInsight(null)} className="text-slate-400 hover:text-slate-600">Nueva consulta</button>
                 </div>
                 <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                   {aiInsight}
                 </div>
               </div>
             ) : (
               <div className="hidden md:block opacity-20 text-[10rem] select-none pointer-events-none">🤖</div>
             )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
      </section>
    </div>
  );
};

export default ExpenseAnalysis;
