
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  logo?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userName, logo }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Movimientos', icon: '💸' },
    { id: 'analysis', label: 'Análisis', icon: '📈' },
    { id: 'debts', label: 'Deudas', icon: '📉' },
    { id: 'calendar', label: 'Calendario', icon: '🗓️' },
    { id: 'budgets', label: 'Presupuestos', icon: '🎯' },
    { id: 'settings', label: 'Ajustes', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <nav className="bg-white border-r border-slate-200 w-full md:w-64 flex-shrink-0 flex md:flex-col shadow-sm sticky top-0 md:h-screen z-10">
        <div className="p-6 border-b border-slate-100 hidden md:block text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            {logo ? (
              <div className="mb-2">
                <img
                  src={logo}
                  alt="App Logo"
                  className="w-16 h-16 object-contain rounded-2xl shadow-sm border border-slate-100"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-1 leading-none">
                <span className="text-3xl">💎</span>
                <span className="tracking-tighter">FINANZAS <br /> PRO</span>
              </h1>
            )}
            {logo && <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">FINANZAS PRO</span>}
          </div>
          <div className="mt-4 p-3 bg-indigo-50 rounded-2xl">
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Bienvenido</p>
            <p className="text-sm font-bold text-indigo-700 truncate">{userName}</p>
          </div>
        </div>

        {/* Mobile Header with Logo */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white">
          {logo ? (
            <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <span className="font-black text-indigo-600 tracking-tighter text-lg uppercase">💎 Finanzas Pro</span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg truncate max-w-[80px]">{userName}</span>
          </div>
        </div>

        <div className="flex-1 flex md:flex-col p-2 gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;