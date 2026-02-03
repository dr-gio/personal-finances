
import React, { useState } from 'react';
import { Category, Budget, Transaction } from '../types';

interface BudgetManagerProps {
  budgets: Budget[];
  categories: Category[];
  currency: string;
  transactions: Transaction[];
  onUpdate: (categoryId: string, limit: number) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgets, categories, currency, transactions, onUpdate }) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleEdit = (categoryId: string, current: number) => {
    setEditingCategoryId(categoryId);
    setInputValue(current.toString());
  };

  const handleSave = (categoryId: string) => {
    onUpdate(categoryId, parseFloat(inputValue) || 0);
    setEditingCategoryId(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Presupuestos</h2>
        <p className="text-slate-500">Límites de gasto por cada una de tus categorías</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map(cat => {
          const budget = budgets.find(b => b.categoryId === cat.id)?.limit || 0;
          const spent = transactions
            .filter(t => t.categoryId === cat.id && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          
          const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const isOver = spent > budget && budget > 0;

          return (
            <div key={cat.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative group overflow-hidden transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="font-black text-slate-800 uppercase text-xs tracking-widest">{cat.name}</span>
                </div>
                <button
                  onClick={() => handleEdit(cat.id, budget)}
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-black uppercase tracking-widest"
                >
                  Definir
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Gastado: {currency}{spent.toLocaleString()}</span>
                  <span>Meta: {currency}{budget.toLocaleString()}</span>
                </div>
                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progress}%`, backgroundColor: !isOver ? cat.color : undefined }}
                  />
                </div>
                {isOver && (
                  <p className="text-rose-500 text-[10px] font-black uppercase tracking-tighter animate-pulse">¡Has superado el límite!</p>
                )}
              </div>

              {editingCategoryId === cat.id && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-6 flex flex-col justify-center gap-3 z-10 animate-in fade-in">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Límite Mensual</label>
                  <input
                    autoFocus
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 border border-indigo-100 rounded-2xl outline-none font-bold text-lg"
                    placeholder="0.00"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(cat.id)} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest">Guardar</button>
                    <button onClick={() => setEditingCategoryId(null)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">Cerrar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetManager;
