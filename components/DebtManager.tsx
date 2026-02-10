
import React, { useState } from 'react';
import { Debt, DebtType, Account, Category, Obligation } from '../types';

interface DebtManagerProps {
  debts: Debt[];
  accounts: Account[];
  categories: Category[];
  currency: string;
  onAdd: (d: Omit<Debt, 'id'>) => void;
  onUpdate: (id: string, d: Partial<Debt>) => void;
  onDelete: (id: string) => void;
  onPayment: (amount: number, debtId: string, accountId: string) => void;
  onAddObligation: (o: Omit<Obligation, 'id' | 'isPaid'>) => void;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, accounts, categories, currency, onAdd, onUpdate, onDelete, onPayment, onAddObligation }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<string | null>(null);
  const [createObligation, setCreateObligation] = useState(false);

  const initialForm = {
    name: '',
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    dueDate: '',
    type: 'loan' as DebtType,
    color: '#6366f1',
    icon: '📉'
  };

  const [formData, setFormData] = useState(initialForm);

  const [paymentData, setPaymentData] = useState({
    amount: '',
    accountId: accounts?.[0]?.id || ''
  });

  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      totalAmount: debt.totalAmount.toString(),
      remainingAmount: debt.remainingAmount.toString(),
      interestRate: debt.interestRate?.toString() || '',
      dueDate: debt.dueDate || '',
      type: debt.type,
      color: debt.color,
      icon: debt.icon
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalAmount) return;

    const debtPayload = {
      name: formData.name,
      totalAmount: parseFloat(formData.totalAmount),
      remainingAmount: parseFloat(formData.remainingAmount || formData.totalAmount),
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      dueDate: formData.dueDate,
      type: formData.type,
      color: formData.color,
      icon: formData.icon
    };

    if (editingDebt) {
      onUpdate(editingDebt.id, debtPayload);
    } else {
      onAdd(debtPayload);

      // Enlazar como obligación si hay fecha y se marcó el check
      if (createObligation && formData.dueDate) {
        onAddObligation({
          description: `Cuota: ${formData.name}`,
          amount: parseFloat(formData.totalAmount) / 12, // Estimación por defecto
          categoryId: categories.find(c => c.name === 'Deudas')?.id || categories[0].id,
          accountId: accounts[0].id,
          dueDate: formData.dueDate,
          isRecurring: true
        });
      }
    }

    setIsModalOpen(false);
    setEditingDebt(null);
    setFormData(initialForm);
    setCreateObligation(false);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaymentModalOpen || !paymentData.amount || !paymentData.accountId) return;

    onPayment(parseFloat(paymentData.amount), isPaymentModalOpen, paymentData.accountId);
    setIsPaymentModalOpen(null);
    setPaymentData({ amount: '', accountId: accounts?.[0]?.id || '' });
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Deudas y Créditos</h2>
          <p className="text-slate-600 font-medium">Configura y controla tus préstamos, vehículos y tarjetas</p>
        </div>
        <button
          onClick={() => { setEditingDebt(null); setFormData(initialForm); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 active:scale-95"
        >
          <span>➕</span> Nuevo Crédito
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {debts.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
            <span className="text-6xl mb-4 block">🥳</span>
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">¡Sin deudas activas!</p>
          </div>
        ) : (
          debts.map(debt => {
            const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
            const isFinished = debt.remainingAmount <= 0;

            return (
              <div key={debt.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative group transition-all hover:shadow-xl hover:border-indigo-100">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-sm border border-slate-50" style={{ backgroundColor: debt.color + '15', color: debt.color }}>
                      {debt.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{debt.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {debt.type === 'credit_card' ? 'Tarjeta de Crédito' :
                          debt.type === 'loan' ? 'Crédito Personal' :
                            debt.type === 'mortgage' ? 'Hipotecario' :
                              debt.type === 'vehicle' ? 'Crédito Vehículo' : 'Otros'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(debt)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">✏️</button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar este registro de deuda?')) {
                          onDelete(debt.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Actual</p>
                      <p className={`text-4xl font-black tracking-tighter ${isFinished ? 'text-emerald-500' : 'text-slate-900'}`}>
                        {currency}{debt.remainingAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Límite: {currency}{debt.totalAmount.toLocaleString()}</p>
                      {debt.interestRate && (
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Tasa: {debt.interestRate}% EA</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                      <div
                        className="h-full transition-all duration-1000 ease-out rounded-full shadow-inner"
                        style={{ width: `${progress}%`, backgroundColor: debt.color }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                      <span>{Math.round(progress)}% Amortizado</span>
                      {debt.dueDate && (
                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                          📅 Pago: {debt.dueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isFinished && (
                    <button
                      onClick={() => setIsPaymentModalOpen(debt.id)}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                      Abonar a Deuda
                    </button>
                  )}
                  {isFinished && (
                    <div className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] text-center border border-emerald-100">
                      ✨ Deuda Liquidada
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nueva/Editar Deuda */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {editingDebt ? 'Editar Crédito' : 'Configurar Nuevo Crédito'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingDebt(null); }} className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all active:scale-90 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Nombre o Alias</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Financiación Moto, Crédito Carro"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Tipo de Crédito</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({
                      ...formData,
                      type: e.target.value as DebtType,
                      icon: e.target.value === 'credit_card' ? '💳' : e.target.value === 'loan' ? '💸' : e.target.value === 'mortgage' ? '🏠' : e.target.value === 'vehicle' ? '🚗' : '📉'
                    })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 appearance-none"
                  >
                    <option value="loan">💸 Préstamo Personal</option>
                    <option value="credit_card">💳 Tarjeta de Crédito</option>
                    <option value="vehicle">🚗 Crédito de Vehículo</option>
                    <option value="mortgage">🏠 Hipoteca / Vivienda</option>
                    <option value="other">📉 Otro tipo de deuda</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Monto Total / Límite</label>
                  <input
                    type="number"
                    required
                    value={formData.totalAmount}
                    onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg text-slate-900"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Saldo Actual a Pagar</label>
                  <input
                    type="number"
                    placeholder="Mismo que total si es nuevo"
                    value={formData.remainingAmount}
                    onChange={e => setFormData({ ...formData, remainingAmount: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Tasa Interés Anual (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.interestRate}
                    onChange={e => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Fecha de Pago (Obligación)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Color de Referencia</label>
                  <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-12 rounded-xl border-none cursor-pointer overflow-hidden p-0 bg-transparent"
                    />
                    <span className="text-sm font-black text-slate-700 uppercase tracking-tighter">{formData.color}</span>
                  </div>
                </div>
                {!editingDebt && (
                  <div
                    onClick={() => setCreateObligation(!createObligation)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${createObligation ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                  >
                    <div className={`w-10 h-6 rounded-full transition-all relative ${createObligation ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${createObligation ? 'right-1' : 'left-1'}`} />
                    </div>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Añadir al Calendario</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-[0.98]"
              >
                {editingDebt ? 'Actualizar Datos' : 'Registrar Crédito'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Realizar Abono */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Realizar Pago</h3>
              <button onClick={() => setIsPaymentModalOpen(null)} className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-all active:scale-90 text-xl">✕</button>
            </div>
            <form onSubmit={handlePayment} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Valor del Pago</label>
                <input
                  type="number"
                  required
                  autoFocus
                  value={paymentData.amount}
                  onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-emerald-500 outline-none font-black text-4xl text-slate-900 text-center"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest px-1">Cuenta de Origen</label>
                <select
                  value={paymentData.accountId}
                  onChange={e => setPaymentData({ ...paymentData, accountId: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({currency}{acc.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
              >
                Confirmar Abono
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManager;
