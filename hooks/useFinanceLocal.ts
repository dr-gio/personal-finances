
import { useState, useEffect } from 'react';
import { Transaction, Budget, Category, AppSettings, INITIAL_CATEGORIES, Obligation, Account, INITIAL_ACCOUNTS, Debt } from '../types';

export const useFinance = () => {
  const getSafeStorage = <T>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null || saved === 'undefined') return fallback;
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Error loading ${key} from storage:`, e);
      return fallback;
    }
  };

  const [categories, setCategories] = useState<Category[]>(() => getSafeStorage('finanzapro_categories', INITIAL_CATEGORIES));
  const [accounts, setAccounts] = useState<Account[]>(() => getSafeStorage('finanzapro_accounts', INITIAL_ACCOUNTS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getSafeStorage('finanzapro_transactions', []));
  const [budgets, setBudgets] = useState<Budget[]>(() => getSafeStorage('finanzapro_budgets', []));
  const [obligations, setObligations] = useState<Obligation[]>(() => getSafeStorage('finanzapro_obligations', []));
  const [debts, setDebts] = useState<Debt[]>(() => getSafeStorage('finanzapro_debts', []));
  const [settings, setSettings] = useState<AppSettings>(() => getSafeStorage('finanzapro_settings', { 
    userName: 'Usuario', 
    currency: '$', 
    primaryColor: '#4f46e5',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b'
  }));

  useEffect(() => {
    localStorage.setItem('finanzapro_categories', JSON.stringify(categories));
    localStorage.setItem('finanzapro_accounts', JSON.stringify(accounts));
    localStorage.setItem('finanzapro_transactions', JSON.stringify(transactions));
    localStorage.setItem('finanzapro_budgets', JSON.stringify(budgets));
    localStorage.setItem('finanzapro_obligations', JSON.stringify(obligations));
    localStorage.setItem('finanzapro_debts', JSON.stringify(debts));
    localStorage.setItem('finanzapro_settings', JSON.stringify(settings));
  }, [categories, accounts, transactions, budgets, obligations, debts, settings]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newId = crypto.randomUUID();
    setTransactions(prev => [{ ...t, id: newId }, ...prev]);

    setAccounts(prev => prev.map(acc => {
      if (acc.id === t.accountId) {
        if (t.type === 'income') return { ...acc, balance: acc.balance + t.amount };
        return { ...acc, balance: acc.balance - t.amount };
      }
      if (t.type === 'transfer' && acc.id === t.targetAccountId) {
        return { ...acc, balance: acc.balance + t.amount };
      }
      return acc;
    }));

    if (t.type === 'debt_payment' && t.debtId) {
      setDebts(prev => prev.map(d => d.id === t.debtId ? { ...d, remainingAmount: Math.max(0, d.remainingAmount - t.amount) } : d));
    }
  };

  const updateTransaction = (id: string, updated: Omit<Transaction, 'id'>) => {
    deleteTransaction(id);
    addTransaction(updated);
  };

  const deleteTransaction = (id: string) => {
    const trans = transactions.find(t => t.id === id);
    if (!trans) return;

    setTransactions(prev => prev.filter(t => t.id !== id));

    setAccounts(prev => prev.map(acc => {
      if (acc.id === trans.accountId) {
        if (trans.type === 'income') return { ...acc, balance: acc.balance - trans.amount };
        return { ...acc, balance: acc.balance + trans.amount };
      }
      if (trans.type === 'transfer' && acc.id === trans.targetAccountId) {
        return { ...acc, balance: acc.balance - trans.amount };
      }
      return acc;
    }));

    if (trans.type === 'debt_payment' && trans.debtId) {
      setDebts(prev => prev.map(d => d.id === trans.debtId ? { ...d, remainingAmount: d.remainingAmount + trans.amount } : d));
    }
  };

  const addDebt = (d: Omit<Debt, 'id'>) => {
    setDebts(prev => [...prev, { ...d, id: crypto.randomUUID() }]);
  };

  const updateDebt = (id: string, d: Partial<Debt>) => {
    setDebts(prev => prev.map(debt => debt.id === id ? { ...debt, ...d } : debt));
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  const addAccount = (a: Omit<Account, 'id'>) => {
    setAccounts(prev => [...prev, { ...a, id: crypto.randomUUID() }]);
  };

  const updateAccount = (id: string, a: Partial<Account>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...a } : acc));
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const updateBudget = (categoryId: string, limit: number) => {
    setBudgets(prev => {
      const existing = prev.find(b => b.categoryId === categoryId);
      if (existing) return prev.map(b => b.categoryId === categoryId ? { ...b, limit } : b);
      return [...prev, { categoryId, limit }];
    });
  };

  const addObligation = (o: Omit<Obligation, 'id' | 'isPaid'>) => {
    setObligations(prev => [...prev, { ...o, id: crypto.randomUUID(), isPaid: false }]);
  };

  const updateObligation = (id: string, o: Partial<Obligation>) => {
    setObligations(prev => prev.map(ob => ob.id === id ? { ...ob, ...o } : ob));
  };

  const markAsPaid = (id: string) => {
    const obligation = obligations.find(o => o.id === id);
    if (!obligation || obligation.isPaid) return;

    setObligations(prev => prev.map(o => o.id === id ? { ...o, isPaid: true } : o));
    
    addTransaction({
      amount: obligation.amount,
      categoryId: obligation.categoryId,
      accountId: obligation.accountId,
      description: `Pago: ${obligation.description}`,
      date: new Date().toISOString().split('T')[0],
      type: 'expense'
    });

    if (obligation.isRecurring) {
      const nextDate = new Date(obligation.dueDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      addObligation({
        description: obligation.description,
        amount: obligation.amount,
        categoryId: obligation.categoryId,
        accountId: obligation.accountId,
        dueDate: nextDate.toISOString().split('T')[0],
        isRecurring: true
      });
    }
  };

  const deleteObligation = (id: string) => {
    setObligations(prev => prev.filter(o => o.id !== id));
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...c, id: crypto.randomUUID() }]);
  };

  const updateCategory = (id: string, c: Partial<Category>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...c } : cat));
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const balance = (accounts || []).reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalDebt = (debts || []).reduce((sum, d) => sum + d.remainingAmount, 0);

  return {
    categories: categories || [],
    accounts: accounts || [],
    transactions: transactions || [],
    budgets: budgets || [],
    obligations: obligations || [],
    debts: debts || [],
    settings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    updateBudget,
    addObligation,
    updateObligation,
    markAsPaid,
    deleteObligation,
    addCategory,
    updateCategory,
    deleteCategory,
    addDebt,
    updateDebt,
    deleteDebt,
    setSettings,
    balance,
    totalDebt,
    totalIncome: (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    totalExpense: (transactions || []).filter(t => t.type === 'expense' || t.type === 'debt_payment').reduce((s, t) => s + t.amount, 0)
  };
};
