
import React, { useState, useRef } from 'react';
import { Transaction, Category, TransactionType, Account, Attachment } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currency: string;
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (id: string, t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, accounts, currency, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<Attachment[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialForm = {
    amount: '',
    categoryId: categories?.[0]?.id || '',
    accountId: accounts?.[0]?.id || '',
    targetAccountId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as TransactionType,
    attachments: [] as Attachment[]
  };

  const [formData, setFormData] = useState(initialForm);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      const promise = new Promise<Attachment>((resolve) => {
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type,
            data: reader.result as string
          });
        };
      });

      reader.readAsDataURL(file);
      newAttachments.push(await promise);
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const startEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
      amount: t.amount.toString(),
      categoryId: t.categoryId,
      accountId: t.accountId,
      targetAccountId: t.targetAccountId || '',
      description: t.description,
      date: t.date,
      type: t.type,
      attachments: t.attachments || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.accountId) return;

    const finalCatId = formData.type === 'transfer'
      ? (categories.find(c => c.name === 'Transferencia')?.id || formData.categoryId || categories?.[0]?.id || '')
      : (formData.categoryId || categories?.[0]?.id || '');

    const payload = {
      amount: parseFloat(formData.amount),
      categoryId: finalCatId,
      accountId: formData.accountId,
      targetAccountId: formData.type === 'transfer' ? formData.targetAccountId : undefined,
      description: formData.description,
      date: formData.date,
      type: formData.type,
      attachments: formData.attachments.length > 0 ? formData.attachments : undefined
    };

    try {
      if (editingTransaction) {
        await onUpdate(editingTransaction.id, payload);
        alert('✅ Movimiento actualizado correctamente');
      } else {
        await onAdd(payload);
        alert('✅ Movimiento registrado correctamente');
      }

      setFormData(initialForm);
      setEditingTransaction(null);
      setIsModalOpen(false);
    } catch (err) {
      // Hook handles logging, but we can catch here if needed.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Movimientos</h2>
          <p className="text-slate-500">Configura y gestiona cada registro de tu dinero</p>
        </div>
        <button
          onClick={() => { setEditingTransaction(null); setFormData(initialForm); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 active:scale-95"
        >
          <span>➕</span> Nuevo Registro
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-6 py-5">Fecha</th>
                <th className="px-6 py-5">Detalle</th>
                <th className="px-6 py-5">Cuenta</th>
                <th className="px-6 py-5">Soporte</th>
                <th className="px-6 py-5 text-right">Monto</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-300 font-medium italic">
                    Sin movimientos registrados.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  const acc = accounts.find(a => a.id === t.accountId);
                  const targetAcc = t.type === 'transfer' ? accounts.find(a => a.id === t.targetAccountId) : null;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-5 text-sm font-bold text-slate-400">{t.date}</td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-800">{t.description}</p>
                        {t.type === 'transfer' && (
                          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
                            {acc?.name} ➡️ {targetAcc?.name}
                          </p>
                        )}
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{cat?.name}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          {acc?.icon} {acc?.name}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {t.attachments && t.attachments.length > 0 ? (
                          <button
                            onClick={() => setViewingAttachments(t.attachments!)}
                            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                          >
                            📎 {t.attachments.length} Archivo(s)
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px] uppercase font-bold tracking-widest">Sin soporte</span>
                        )}
                      </td>
                      <td className={`px-6 py-5 text-right text-sm font-black ${t.type === 'income' ? 'text-emerald-500' :
                        t.type === 'expense' || t.type === 'debt_payment' ? 'text-rose-500' :
                          'text-indigo-500'
                        }`}>
                        {t.type === 'income' ? '+' : (t.type === 'expense' || t.type === 'debt_payment') ? '-' : '⇄'}{currency}{t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(t)} className="text-slate-400 hover:text-indigo-600">✏️</button>
                          <button
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de que deseas eliminar este movimiento? El saldo de tu cuenta se revertirá automáticamente.')) {
                                onDelete(t.id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-500"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visor de Soportes */}
      {viewingAttachments && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-8">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Soportes del Movimiento</h3>
              <button onClick={() => setViewingAttachments(null)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-all active:scale-90 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {viewingAttachments.map((file, idx) => (
                <div key={idx} className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 group">
                  <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{file.name}</p>
                    <a href={file.data} download={file.name} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">Descargar</a>
                  </div>
                  <div className="p-4 flex items-center justify-center bg-slate-100 min-h-[200px]">
                    {file.type.startsWith('image/') ? (
                      <img src={file.data} alt={file.name} className="max-w-full h-auto rounded-xl shadow-sm" />
                    ) : (
                      <div className="text-center">
                        <span className="text-6xl mb-2 block">📄</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{file.type || 'Archivo'}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {editingTransaction ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingTransaction(null); }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                {['expense', 'income', 'transfer'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type as TransactionType })}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === type
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400'
                      }`}
                  >
                    {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Transf.'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Monto</label>
                  <input
                    type="number"
                    required
                    autoFocus={!editingTransaction}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  {formData.type === 'transfer' ? 'Cuenta Origen' : 'Cuenta'}
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.icon} {a.name} ({currency}{a.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              {formData.type === 'transfer' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cuenta Destino</label>
                  <select
                    value={formData.targetAccountId}
                    required
                    onChange={(e) => setFormData({ ...formData, targetAccountId: e.target.value })}
                    className="w-full px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl outline-none font-bold"
                  >
                    <option value="">Seleccionar destino...</option>
                    {accounts.filter(a => a.id !== formData.accountId).map(a => (
                      <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type !== 'transfer' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Categoría</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                  >
                    {categories.filter(c => c.name !== 'Transferencia').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Concepto</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  placeholder="Ej: Mercado mensual"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gestión de Soportes</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">📎</span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Añadir nuevos archivos</p>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {formData.attachments.map((file, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg flex-shrink-0">{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                          <span className="text-[10px] font-bold text-slate-600 truncate">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-700 transition-all mt-4 shadow-xl shadow-indigo-100 active:scale-[0.98]"
              >
                {editingTransaction ? 'Guardar Cambios' : 'Registrar Movimiento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
