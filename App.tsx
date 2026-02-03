
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import BudgetManager from './components/BudgetManager';
import Settings from './components/Settings';
import PaymentCalendar from './components/PaymentCalendar';
import DebtManager from './components/DebtManager';
import ExpenseAnalysis from './components/ExpenseAnalysis';
import { useFinance } from './hooks/useFinance';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const finance = useFinance();

  // Inyección dinámica de tema con 3 colores
  useEffect(() => {
    const root = document.documentElement;
    const c1 = finance.settings.primaryColor || '#4f46e5';
    const c2 = finance.settings.secondaryColor || '#10b981';
    const c3 = finance.settings.accentColor || '#f59e0b';
    
    root.style.setProperty('--primary-color', c1);
    root.style.setProperty('--secondary-color', c2);
    root.style.setProperty('--accent-color', c3);
    
    let styleTag = document.getElementById('dynamic-theme');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-theme';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
      :root {
        --primary-main: ${c1};
        --primary-soft: ${c1}15;
        --secondary-main: ${c2};
        --secondary-soft: ${c2}15;
        --accent-main: ${c3};
        --accent-soft: ${c3}15;
      }
      .bg-primary { background-color: var(--primary-main) !important; }
      .text-primary { color: var(--primary-main) !important; }
      .border-primary { border-color: var(--primary-main) !important; }
      
      .bg-indigo-600 { background-color: var(--primary-main) !important; }
      .text-indigo-600 { color: var(--primary-main) !important; }
      .border-indigo-600 { border-color: var(--primary-main) !important; }
      .bg-indigo-50 { background-color: var(--primary-soft) !important; }
      .text-indigo-700 { color: var(--primary-main) !important; }
      
      .bg-emerald-600 { background-color: var(--secondary-main) !important; }
      .text-emerald-500 { color: var(--secondary-main) !important; }
      
      .bg-amber-100 { background-color: var(--accent-soft) !important; }
      .text-amber-600 { color: var(--accent-main) !important; }

      .hover\\:bg-indigo-700:hover { filter: brightness(0.9); }
      
      input, select, textarea {
        color: #0f172a !important;
      }
      .bg-emerald-600 input, .bg-indigo-600 input, .bg-emerald-600 select, .bg-indigo-600 select, .bg-slate-900 input, .bg-slate-900 select {
        color: #ffffff !important;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f5f9;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
  }, [finance.settings.primaryColor, finance.settings.secondaryColor, finance.settings.accentColor]);

  const handleDebtPayment = (amount: number, debtId: string, accountId: string) => {
    const debt = finance.debts.find(d => d.id === debtId);
    if (!debt) return;

    finance.addTransaction({
      amount,
      categoryId: finance.categories.find(c => c.name === 'Deudas')?.id || finance.categories[0].id,
      accountId,
      debtId,
      description: `Abono a: ${debt.name}`,
      date: new Date().toISOString().split('T')[0],
      type: 'debt_payment'
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            balance={finance.balance}
            totalIncome={finance.totalIncome}
            totalExpense={finance.totalExpense}
            totalDebt={finance.totalDebt}
            transactions={finance.transactions}
            categories={finance.categories}
            accounts={finance.accounts}
            currency={finance.settings.currency}
          />
        );
      case 'transactions':
        return (
          <TransactionList
            transactions={finance.transactions}
            categories={finance.categories}
            accounts={finance.accounts}
            currency={finance.settings.currency}
            onAdd={finance.addTransaction}
            onUpdate={finance.updateTransaction}
            onDelete={finance.deleteTransaction}
          />
        );
      case 'analysis':
        return (
          <ExpenseAnalysis 
            transactions={finance.transactions}
            categories={finance.categories}
            budgets={finance.budgets}
            debts={finance.debts}
            currency={finance.settings.currency}
          />
        );
      case 'debts':
        return (
          <DebtManager
            debts={finance.debts}
            accounts={finance.accounts}
            categories={finance.categories}
            currency={finance.settings.currency}
            onAdd={finance.addDebt}
            onUpdate={finance.updateDebt}
            onDelete={finance.deleteDebt}
            onPayment={handleDebtPayment}
            onAddObligation={finance.addObligation}
          />
        );
      case 'calendar':
        return (
          <PaymentCalendar
            obligations={finance.obligations}
            categories={finance.categories}
            accounts={finance.accounts}
            currency={finance.settings.currency}
            onAdd={finance.addObligation}
            onUpdate={finance.updateObligation}
            onPay={finance.markAsPaid}
            onDelete={finance.deleteObligation}
          />
        );
      case 'budgets':
        return (
          <BudgetManager
            budgets={finance.budgets}
            categories={finance.categories}
            currency={finance.settings.currency}
            transactions={finance.transactions}
            onUpdate={finance.updateBudget}
          />
        );
      case 'settings':
        return (
          <Settings
            categories={finance.categories}
            accounts={finance.accounts}
            settings={finance.settings}
            onAddCategory={finance.addCategory}
            onUpdateCategory={finance.updateCategory}
            onDeleteCategory={finance.deleteCategory}
            onAddAccount={finance.addAccount}
            onUpdateAccount={finance.updateAccount}
            onDeleteAccount={finance.deleteAccount}
            onUpdateSettings={finance.setSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userName={finance.settings.userName}
      logo={finance.settings.logo}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
