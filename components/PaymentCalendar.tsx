
import React, { useState } from 'react';
import { Obligation, Category, Account } from '../types';

interface PaymentCalendarProps {
  obligations: Obligation[];
  categories: Category[];
  accounts: Account[];
  currency: string;
  onAdd: (o: Omit<Obligation, 'id' | 'isPaid'>) => void;
  onUpdate: (id: string, o: Partial<Obligation>) => void;
  onPay: (id: string) => void;
  onDelete: (id: string) => void;
}

const PaymentCalendar: React.FC<PaymentCalendarProps> = ({ obligations, categories, accounts, currency, onAdd, onUpdate, onPay, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState<Obligation | null>(null);

  const initialForm = {
    description: '',
    amount: '',
    categoryId: categories?.[0]?.id || '',
    accountId: accounts?.[0]?.id || '',
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: false
  };

  const [formData, setFormData] = useState(initialForm);

  const sortedObligations = [...(obligations || [])].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleOpenEdit = (o: Obligation) => {
    setEditingObligation(o);
    setFormData({
      description: o.description,
      amount: o.amount.toString(),
      categoryId: o.categoryId,
      accountId: o.accountId,
      dueDate: o.dueDate,
      isRecurring: o.isRecurring
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;
    
    const payload = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId || categories?.[0]?.id || '',
      accountId: formData.accountId || accounts?.[0]?.id || '',
      dueDate: formData.dueDate,
      isRecurring: formData.isRecurring
    };

    if (editingObligation) {
      onUpdate(editingObligation.id, payload);
    } else {
      onAdd(payload);
    }

    setFormData(initialForm);
    setEditingObligation(null);
    setIsModalOpen(false);
  };

  const getGoogleCalendarUrl = (o: Obligation) => {
    const date = o.dueDate.replace(/-/g, '');
    const text = encodeURIComponent(`Pagar ${o.description}`);
    const details = encodeURIComponent(`Recordatorio de FinanzaPro: Pagar ${currency}${o.amount}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${date}/${date}&details=${details}&sf=true&output=xml`;
  };

  const getStatus = (o: Obligation) => {
    if (o.isPaid) return { label: 'Pagado', color: 'bg-emerald-100 text-emerald-600', icon: '✅' };
    const today = new Date().toISOString().split('T')[0];
    if (o.dueDate < today) return { label: 'Vencido', color: 'bg-rose-100 text-rose-600', icon: '⚠️' };
    return { label: 'Pendiente', color: 'bg-amber-100 text-amber-600', icon: '⏳' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Calendario de Pagos</h2>
          <p className="text-slate-500">Gestiona tus obligaciones y vencimientos</p>
        </div>
        <button
          onClick={() => { setEditingObligation(null); setFormData(initialForm); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
        >
          <span>🗓️</span> Nueva Obligación
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedObligations.length === 0 ? (
          <div className="bg-white p-16 rounded-[2rem] border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-medium">No tienes pagos programados aún.</p>
          </div>
        ) : (
          sortedObligations.map(o => {
            const status = getStatus(o);
            const cat = categories.find(c => c.id === o.categoryId);
            const acc = accounts.find(a => a.id === o.accountId);
            return (
              <div key={o.id} className={`bg-white p-6 rounded-3xl border ${o.isPaid ? 'border-slate-100 opacity-75' : 'border-indigo-50 shadow-sm'} flex flex-wrap items-center justify-between gap-6 transition-all hover:scale-[1.01] group`}>
                <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl" style={{ borderLeft: `4px solid ${cat?.color || '#eee'}` }}>
                    {cat?.icon || '📅'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">{o.description}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.dueDate} {o.isRecurring && '• Recurrente'}</p>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">Vía: {acc?.name || 'No especificada'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center px-6">
                  <span className="text-2xl font-black text-slate-800">{currency}{(o.amount || 0).toLocaleString()}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${status.color}`}>
                    {status.icon} {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!o.isPaid && (
                    <>
                      <button
                        onClick={() => onPay(o.id)}
                        className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all"
                      >
                        Pagar
                      </button>
                      <a
                        href={getGoogleCalendarUrl(o)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-50 transition-all"
                        title="Añadir a Google Calendar"
                      >
                        📅
                      </a>
                    </>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(o)} className="p-2 text-slate-400 hover:text-indigo-600">✏️</button>
                    <button onClick={() => onDelete(o.id)} className="text-slate-300 hover:text-rose-500 p-2 transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingObligation ? 'Editar Obligación' : 'Nueva Obligación'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingObligation(null); }} className="text-slate-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Concepto / Descripción</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                  placeholder="Ej: Mensualidad Crédito Hipotecario"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Monto Cuota</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Día de Pago</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Cuenta de Débito</label>
                <select
                  value={formData.accountId}
                  onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Categoría Relacionada</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl cursor-pointer" onClick={() => setFormData({...formData, isRecurring: !formData.isRecurring})}>
                <div className={`w-10 h-6 rounded-full transition-all relative ${formData.isRecurring ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isRecurring ? 'right-1' : 'left-1'}`} />
                </div>
                <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">¿Es un compromiso recurrente?</span>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                {editingObligation ? 'Guardar Cambios' : 'Confirmar Programación'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCalendar;
