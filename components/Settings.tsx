
import React, { useState, useRef } from 'react';
import { Category, AppSettings, Account, AccountType } from '../types';

interface SettingsProps {
  categories: Category[];
  accounts: Account[];
  settings: AppSettings;
  onAddCategory: (c: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, c: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onAddAccount: (a: Omit<Account, 'id'>) => void;
  onUpdateAccount: (id: string, a: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
  onUpdateSettings: (s: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({
  categories, accounts, settings, onAddCategory, onUpdateCategory, onDeleteCategory, onAddAccount, onUpdateAccount, onDeleteAccount, onUpdateSettings
}) => {
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [newCat, setNewCat] = useState({ name: '', icon: '📁', color: '#6366f1' });
  const [newAcc, setNewAcc] = useState({ name: '', type: 'bank' as AccountType, balance: 0, icon: '🏦', color: '#6366f1' });
  const [localSettings, setLocalSettings] = useState(settings);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      onUpdateCategory(editingCat.id, newCat);
      setEditingCat(null);
    } else {
      onAddCategory(newCat);
    }
    setNewCat({ name: '', icon: '📁', color: '#6366f1' });
  };

  const handleAddAcc = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAcc) {
      onUpdateAccount(editingAcc.id, newAcc);
      setEditingAcc(null);
    } else {
      onAddAccount(newAcc);
    }
    setNewAcc({ name: '', type: 'bank', balance: 0, icon: '🏦', color: '#6366f1' });
  };

  const startEditAcc = (acc: Account) => {
    setEditingAcc(acc);
    setNewAcc({ name: acc.name, type: acc.type, balance: acc.balance, icon: acc.icon, color: acc.color });
  };

  const startEditCat = (cat: Category) => {
    setEditingCat(cat);
    setNewCat({ name: cat.name, icon: cat.icon, color: cat.color });
  };

  const handleSaveSettings = async () => {
    await onUpdateSettings(localSettings);
    alert('✅ Configuración guardada correctamente');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updated = { ...localSettings, logo: base64 };
      setLocalSettings(updated);
      onUpdateSettings(updated);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    const updated = { ...localSettings, logo: undefined };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const updateColor = (key: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
  };

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Configuración</h2>
        <p className="text-slate-600 font-medium">Personaliza cada detalle de tu sistema financiero</p>
      </header>

      {/* Perfil, Moneda y Tema */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
          <span>🎨</span> Personalización General
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Tu Nombre</label>
              <input
                type="text"
                value={localSettings.userName}
                onChange={(e) => {
                  const updated = { ...localSettings, userName: e.target.value };
                  setLocalSettings(updated);
                }}
                onBlur={handleSaveSettings}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Moneda</label>
                  <input
                    type="text"
                    value={localSettings.currency}
                    onChange={(e) => {
                      const updated = { ...localSettings, currency: e.target.value };
                      setLocalSettings(updated);
                    }}
                    onBlur={handleSaveSettings}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                    placeholder="$"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Clave AI (Gemini)</label>
                  <input
                    type="password"
                    value={localSettings.geminiApiKey || ''}
                    onChange={(e) => {
                      const updated = { ...localSettings, geminiApiKey: e.target.value };
                      setLocalSettings(updated);
                    }}
                    onBlur={handleSaveSettings}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                    placeholder="Pega tu API Key"
                  />
                </div>
              </div>

              {/* Selector de 3 Colores HEX */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Paleta de Colores (HEX)</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'primaryColor', label: 'Primario', icon: '❶' },
                    { key: 'secondaryColor', label: 'Secundario', icon: '❷' },
                    { key: 'accentColor', label: 'Acento', icon: '❸' },
                  ].map((colorItem) => (
                    <div key={colorItem.key} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 group">
                      <span className="text-indigo-600 font-black text-sm w-8">{colorItem.icon}</span>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{colorItem.label}</p>
                        <input
                          type="text"
                          value={localSettings[colorItem.key as keyof AppSettings] as string}
                          onChange={(e) => updateColor(colorItem.key as any, e.target.value)}
                          onBlur={handleSaveSettings}
                          className="w-full bg-transparent border-none p-0 outline-none font-black text-slate-900 text-sm"
                          placeholder="#000000"
                        />
                      </div>
                      <input
                        type="color"
                        value={localSettings[colorItem.key as keyof AppSettings] as string}
                        onChange={(e) => updateColor(colorItem.key as any, e.target.value)}
                        onBlur={handleSaveSettings}
                        className="w-10 h-10 rounded-xl border-none cursor-pointer overflow-hidden p-0 bg-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Logotipo Personalizado</label>
            <div className="flex items-center gap-6">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-32 h-32 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden bg-slate-50 relative group"
              >
                {localSettings.logo ? (
                  <>
                    <img src={localSettings.logo} alt="Logo preview" className="w-full h-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-black text-[10px] uppercase tracking-widest">Cambiar</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl mb-1">🖼️</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Subir Logo</span>
                  </>
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              {localSettings.logo && (
                <button
                  onClick={removeLogo}
                  className="bg-rose-50 text-rose-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                >
                  Eliminar Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Gestión de Cuentas */}
      <section className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
          <span>🏦</span> Gestión de Cuentas
        </h3>

        <form onSubmit={handleAddAcc} className={`${editingAcc ? 'bg-indigo-600' : 'bg-emerald-600'} p-8 rounded-[2.5rem] shadow-xl transition-all flex flex-wrap gap-6 items-end`}>
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-[11px] font-black text-white/80 uppercase tracking-widest px-1">{editingAcc ? 'Editando Cuenta' : 'Nombre Cuenta'}</label>
            <input
              type="text"
              required
              placeholder="Ej: Ahorros Principal"
              value={newAcc.name}
              onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })}
              className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-2xl focus:ring-2 focus:ring-white outline-none font-bold"
            />
          </div>
          <div className="w-44 space-y-2">
            <label className="text-[11px] font-black text-white/80 uppercase tracking-widest px-1">Tipo</label>
            <select
              value={newAcc.type}
              onChange={(e) => setNewAcc({ ...newAcc, type: e.target.value as AccountType, icon: e.target.value === 'cash' ? '💵' : e.target.value === 'card' ? '💳' : '🏦' })}
              className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white rounded-2xl outline-none font-bold appearance-none"
            >
              <option value="bank" className="text-slate-900">Banco</option>
              <option value="cash" className="text-slate-900">Efectivo</option>
              <option value="card" className="text-slate-900">Tarjeta</option>
            </select>
          </div>
          <div className="w-24 space-y-2">
            <label className="text-[11px] font-black text-white/80 uppercase tracking-widest px-1">Color</label>
            <input
              type="color"
              value={newAcc.color}
              onChange={(e) => setNewAcc({ ...newAcc, color: e.target.value })}
              className="w-full h-[58px] rounded-2xl cursor-pointer bg-white/10 border border-white/20 overflow-hidden"
            />
          </div>
          <div className="w-36 space-y-2">
            <label className="text-[11px] font-black text-white/80 uppercase tracking-widest px-1">Saldo</label>
            <input
              type="number"
              value={newAcc.balance}
              onChange={(e) => setNewAcc({ ...newAcc, balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white rounded-2xl focus:ring-2 focus:ring-white outline-none font-bold"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all shadow-lg active:scale-95">
              {editingAcc ? 'Actualizar' : 'Crear'}
            </button>
            {editingAcc && (
              <button type="button" onClick={() => { setEditingAcc(null); setNewAcc({ name: '', type: 'bank', balance: 0, icon: '🏦', color: '#6366f1' }); }} className="bg-rose-500 text-white px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-all">
                ✕
              </button>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all" style={{ borderLeft: `8px solid ${acc.color || '#eee'}` }}>
              <div className="flex items-center gap-4">
                <span className="text-2xl w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl">
                  {acc.icon}
                </span>
                <div>
                  <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest opacity-60">{acc.name}</p>
                  <p className="text-lg font-black text-slate-900">{settings.currency}{acc.balance.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEditAcc(acc)} className="p-2 text-slate-400 hover:text-indigo-600">✏️</button>
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta? Se perderá el rastro de sus saldos.')) {
                      onDeleteAccount(acc.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gestión de Categorías */}
      <section className="space-y-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
          <span>🏷️</span> Gestión de Categorías
        </h3>

        <form onSubmit={handleAddCat} className={`${editingCat ? 'bg-indigo-700' : 'bg-indigo-600'} p-8 rounded-[2.5rem] shadow-xl flex flex-wrap gap-6 items-end transition-all`}>
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-[11px] font-black text-white/80 uppercase tracking-widest px-1">{editingCat ? 'Editando Categoría' : 'Nombre Categoría'}</label>
            <input
              type="text"
              required
              placeholder="Ej: Alimentación"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-2xl focus:ring-2 focus:ring-white outline-none font-bold"
            />
          </div>
          <div className="w-24 space-y-2">
            <label className="text-[11px] font-black text-white/80 uppercase tracking-widest px-1">Color</label>
            <input
              type="color"
              value={newCat.color}
              onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
              className="w-full h-[58px] rounded-2xl cursor-pointer bg-white/10 border border-white/20 overflow-hidden"
            />
          </div>
          <div className="w-24 space-y-2">
            <label className="text-[11px] font-black text-white/80 uppercase tracking-widest px-1">Icono</label>
            <input
              type="text"
              value={newCat.icon}
              onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
              className="w-full px-5 py-4 bg-white/10 border border-white/20 text-white text-center rounded-2xl focus:ring-2 focus:ring-white outline-none font-bold text-xl"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all shadow-lg active:scale-95">
              {editingCat ? 'Actualizar' : 'Añadir'}
            </button>
            {editingCat && (
              <button type="button" onClick={() => { setEditingCat(null); setNewCat({ name: '', icon: '📁', color: '#6366f1' }); }} className="bg-rose-500 text-white px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-all">
                ✕
              </button>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-4">
                <span className="text-2xl w-14 h-14 flex items-center justify-center bg-slate-50 rounded-2xl" style={{ borderLeft: `8px solid ${cat.color}` }}>
                  {cat.icon}
                </span>
                <span className="font-black text-slate-800 uppercase text-xs tracking-widest">{cat.name}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEditCat(cat)} className="p-2 text-slate-400 hover:text-indigo-600">✏️</button>
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
                      onDeleteCategory(cat.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Settings;
