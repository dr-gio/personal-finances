
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Transaction, Category, Account, Obligation } from '../types';
import { getUpcomingObligations, daysBetween, getTodayString } from '../utils/dateHelpers';

interface DashboardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currency: string;
  obligations: Obligation[];
  onPayObligation?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ balance, totalIncome, totalExpense, totalDebt, transactions, categories, accounts, currency, obligations, onPayObligation }) => {
  const upcomingPayments = getUpcomingObligations(obligations, 7); // Próximos 7 días
  const today = getTodayString();

  const categoryData = categories.map(cat => {
    const total = transactions
      .filter(t => t.categoryId === cat.id && (t.type === 'expense' || t.type === 'debt_payment'))
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat.name, value: total, color: cat.color };
  }).filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = transactions
      .filter(t => t.date === dateStr && (t.type === 'expense' || t.type === 'debt_payment'))
      .reduce((sum, t) => sum + t.amount, 0);
    return { date: dateStr.split('-').slice(1).join('/'), amount: dayTotal };
  }).reverse();

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Resumen Financiero</h2>
          <p className="text-slate-500 font-medium">Control absoluto de tu dinero</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-indigo-600 px-8 py-5 rounded-[2rem] shadow-xl shadow-indigo-100 text-right text-white">
            <p className="text-[10px] text-indigo-200 font-black uppercase tracking-widest">Patrimonio Total</p>
            <p className="text-3xl font-black">
              {currency}{balance.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 px-8 py-5 rounded-[2rem] shadow-xl shadow-slate-200 text-right text-white">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Deuda Pendiente</p>
            <p className="text-3xl font-black text-rose-400">
              {currency}{totalDebt.toLocaleString()}
            </p>
          </div>
        </div>
      </header>
      {/* Alertas de Pagos Pendientes */}
      {upcomingPayments.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">Alertas de Pago</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {upcomingPayments.map(pay => {
              const diff = daysBetween(today, pay.dueDate);
              const isToday = diff === 0;
              const isOverdue = diff < 0;

              return (
                <div
                  key={pay.id}
                  className={`min-w-[300px] p-6 rounded-[2rem] border-2 flex items-center justify-between shadow-lg transition-all hover:scale-[1.02] ${isOverdue ? 'bg-rose-50 border-rose-200' :
                    isToday ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-100'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isOverdue ? 'bg-rose-500 text-white' :
                      isToday ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                      {isOverdue ? '⚠️' : isToday ? '🔔' : '📅'}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                        {isOverdue ? 'Vencido' : isToday ? 'Vence Hoy' : `En ${diff} días`}
                      </p>
                      <p className="font-black text-slate-900 leading-tight">{pay.description}</p>
                      <p className="font-bold text-slate-600 text-sm">{currency}{pay.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  {onPayObligation && !pay.isPaid && (
                    <button
                      onClick={() => onPayObligation(pay.id)}
                      className="ml-4 px-4 py-2 bg-white text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-900 hover:text-white transition-colors shadow-sm"
                    > Pagar Ahora </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cuentas Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">Mis Cuentas</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="min-w-[240px] bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-indigo-100 transition-all cursor-default"
              style={{ borderBottom: `6px solid ${acc.color || '#e2e8f0'}` }}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-2xl w-14 h-14 flex items-center justify-center bg-slate-50 rounded-3xl group-hover:scale-110 transition-transform">
                  {acc.icon}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full`}
                  style={{ backgroundColor: (acc.color || '#e2e8f0') + '15', color: acc.color }}
                >
                  {acc.type === 'cash' ? 'Efectivo' : acc.type === 'bank' ? 'Banco' : 'Tarjeta'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{acc.name}</p>
                <p className="text-3xl font-black text-slate-900">{currency}{acc.balance.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Ingresos del Mes</p>
          <p className="text-4xl font-black text-emerald-700 mt-2">{currency}{totalIncome.toLocaleString()}</p>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">💰</div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm relative overflow-hidden group">
          <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Gastos y Pagos</p>
          <p className="text-4xl font-black text-rose-700 mt-2">{currency}{totalExpense.toLocaleString()}</p>
          <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform">💸</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight">Actividad Semanal</h3>
          <div className="h-72">
            {last7Days.every(d => d.amount === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <span className="text-4xl mb-2">📊</span>
                <p className="text-sm font-bold">Sin actividad esta semana</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9', radius: 12 }}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', padding: '16px 20px', fontWeight: 800 }}
                  />
                  <Bar dataKey="amount" fill="var(--primary-color)" radius={[12, 12, 12, 12]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight">Distribución</h3>
          <div className="flex-1 h-64">
            {categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <span className="text-4xl mb-2">🍩</span>
                <p className="text-sm font-bold">Sin gastos registrados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-8 space-y-3">
            {categoryData.length > 0 && categoryData.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center justify-between text-[11px] font-black bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-500 uppercase tracking-widest">{c.name}</span>
                </div>
                <span className="text-slate-900">{currency}{c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
