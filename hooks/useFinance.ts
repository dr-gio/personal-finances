
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Transaction, Budget, Category, AppSettings, Obligation, Account, Debt, INITIAL_CATEGORIES, INITIAL_ACCOUNTS } from '../types';

export const useFinance = () => {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
    const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [obligations, setObligations] = useState<Obligation[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [settings, setSettings] = useState<AppSettings>({
        userName: 'Usuario',
        currency: '$',
        primaryColor: '#4f46e5',
        secondaryColor: '#10b981',
        accentColor: '#f59e0b'
    });
    const [userId, setUserId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Load Settings
            const { data: settingsData } = await supabase.from('fp_settings').select('*').eq('user_id', user.id).single();
            if (settingsData) {
                setSettings({
                    userName: settingsData.user_name || 'Usuario',
                    currency: settingsData.currency || '$',
                    primaryColor: settingsData.primary_color || '#4f46e5',
                    secondaryColor: settingsData.secondary_color || '#10b981',
                    accentColor: settingsData.accent_color || '#f59e0b',
                    logo: settingsData.logo
                });
            }

            // Load Accounts
            const { data: accData } = await supabase.from('fp_accounts').select('*');
            if (accData && accData.length > 0) setAccounts(accData);

            // Load Categories
            const { data: catData } = await supabase.from('fp_categories').select('*');
            if (catData && catData.length > 0) setCategories(catData);

            // Load Transactions
            const { data: txData } = await supabase.from('fp_transactions').select('*').order('date', { ascending: false });
            if (txData) {
                setTransactions(txData.map(t => ({
                    id: t.id,
                    amount: parseFloat(t.amount),
                    categoryId: t.category_id,
                    accountId: t.account_id,
                    targetAccountId: t.target_account_id,
                    debtId: t.debt_id,
                    description: t.description,
                    date: t.date,
                    type: t.type as any,
                    attachments: t.attachments || []
                })));
            }

            // Load Debts
            const { data: debtData } = await supabase.from('fp_debts').select('*');
            if (debtData) {
                setDebts(debtData.map(d => ({
                    id: d.id,
                    name: d.name,
                    totalAmount: parseFloat(d.total_amount),
                    remainingAmount: parseFloat(d.remaining_amount),
                    interestRate: d.interest_rate,
                    dueDate: d.due_date,
                    type: d.type as any,
                    icon: d.icon,
                    color: d.color
                })));
            }

            // Load Obligations
            const { data: obData } = await supabase.from('fp_obligations').select('*');
            if (obData) {
                setObligations(obData.map(o => ({
                    id: o.id,
                    description: o.description,
                    amount: parseFloat(o.amount),
                    categoryId: o.category_id,
                    accountId: o.account_id,
                    dueDate: o.due_date,
                    isPaid: o.is_paid,
                    isRecurring: o.is_recurring
                })));
            }

            // Load Budgets
            const { data: bgData } = await supabase.from('fp_budgets').select('*');
            if (bgData) {
                setBudgets(bgData.map(b => ({
                    categoryId: b.category_id,
                    limit: parseFloat(b.limit)
                })));
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Subscribe to realtime changes (simplified: reload all on change)
        // En producción idealmente escucharíamos cambios específicos para no recargar todo
        const channels = [
            supabase.channel('fp_all_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'fp_transactions' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'fp_accounts' }, fetchData)
                .subscribe()
        ];

        return () => {
            channels.forEach(ch => ch.unsubscribe());
        };
    }, [fetchData]);

    // --- ACTIONS ---

    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        if (!userId) return;
        try {
            // Prepare attachments (upload if needed, simplified here to base64 pass-through via JSONB)
            const { error } = await supabase.from('fp_transactions').insert({
                user_id: userId,
                amount: t.amount,
                category_id: t.categoryId,
                account_id: t.accountId,
                target_account_id: t.targetAccountId,
                debt_id: t.debtId,
                description: t.description,
                date: t.date,
                type: t.type,
                attachments: t.attachments
            });

            if (error) throw error;

            // Update Account Balances
            // Esto lo hacemos en el cliente para feedback inmediato, pero idealmente deberíamos recalcular o tener un trigger en SQL
            // Por simplicidad en este prototipo, confiamos en el refetch (optimistic update manual sería mejor)

            // Optimistic update for Accounts
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

            await updateAccountBalances(t);

        } catch (e) {
            console.error("Error adding transaction", e);
        }
    };

    const updateAccountBalances = async (t: Omit<Transaction, 'id'>) => {
        // Very basic logic: fetch accounts, update, save. Not concurrency safe but ok for single user personal app.
        // Better: SQL Trigger.
        // For now we rely on the client optimistic update and eventual consistency.
    }

    const deleteTransaction = async (id: string) => {
        await supabase.from('fp_transactions').delete().eq('id', id);
        fetchData(); // Reload to sync balances potentially
    };

    const updateTransaction = async (id: string, t: Omit<Transaction, 'id'>) => {
        // Simplified: Delete and Create (not efficient but keeps logic simple handling balance updates)
        // Or Update in place
        await supabase.from('fp_transactions').update({
            amount: t.amount,
            category_id: t.categoryId,
            account_id: t.accountId,
            description: t.description,
            date: t.date,
            type: t.type,
        }).eq('id', id);
        fetchData();
    };

    const addAccount = async (a: Omit<Account, 'id'>) => {
        if (!userId) return;
        await supabase.from('fp_accounts').insert({
            user_id: userId,
            name: a.name,
            type: a.type,
            balance: a.balance,
            color: a.color,
            icon: a.icon
        });
        fetchData();
    };

    const updateAccount = async (id: string, a: Partial<Account>) => {
        await supabase.from('fp_accounts').update(a).eq('id', id);
        fetchData();
    }

    const deleteAccount = async (id: string) => {
        await supabase.from('fp_accounts').delete().eq('id', id);
        fetchData();
    }

    const addCategory = async (c: Omit<Category, 'id'>) => {
        if (!userId) return;
        await supabase.from('fp_categories').insert({
            user_id: userId,
            name: c.name,
            color: c.color,
            icon: c.icon
        });
        fetchData();
    }

    const updateCategory = async (id: string, c: Partial<Category>) => {
        await supabase.from('fp_categories').update(c).eq('id', id);
        fetchData();
    }

    const deleteCategory = async (id: string) => {
        await supabase.from('fp_categories').delete().eq('id', id);
        fetchData();
    }

    // Settings
    const updateSettings = async (newSettings: AppSettings) => {
        if (!userId) return;
        const { error } = await supabase.from('fp_settings').upsert({
            user_id: userId,
            user_name: newSettings.userName,
            currency: newSettings.currency,
            primary_color: newSettings.primaryColor,
            secondary_color: newSettings.secondaryColor,
            accent_color: newSettings.accentColor,
            logo: newSettings.logo
        });
        if (!error) setSettings(newSettings);
    };

    // Debts & Budgets handlers (simplified)
    const addDebt = async (d: Omit<Debt, 'id'>) => {
        if (!userId) return;
        await supabase.from('fp_debts').insert({
            user_id: userId,
            name: d.name,
            total_amount: d.totalAmount,
            remaining_amount: d.remainingAmount,
            type: d.type,
            icon: d.icon,
            color: d.color
        });
        fetchData();
    }

    const updateDebt = async (id: string, d: Partial<Debt>) => {
        // mapping partial vars need careful handling or full update
    }

    const deleteDebt = async (id: string) => {
        await supabase.from('fp_debts').delete().eq('id', id);
        fetchData();
    }

    const addObligation = async (o: Omit<Obligation, 'id' | 'isPaid'>) => {
        if (!userId) return;
        await supabase.from('fp_obligations').insert({
            user_id: userId,
            description: o.description,
            amount: o.amount,
            category_id: o.categoryId,
            account_id: o.accountId,
            due_date: o.dueDate,
            is_recurring: o.isRecurring,
            is_paid: false
        });
        fetchData();
    }

    const updateObligation = async (id: string, o: Partial<Obligation>) => {
        await supabase.from('fp_obligations').update({
            is_paid: o.isPaid // Simplified for just marking paid mostly
        }).eq('id', id);
        fetchData();
    }

    const deleteObligation = async (id: string) => {
        await supabase.from('fp_obligations').delete().eq('id', id);
        fetchData();
    }

    const markAsPaid = async (id: string) => {
        const ob = obligations.find(o => o.id === id);
        if (!ob || ob.isPaid) return;

        // Update obligation
        await updateObligation(id, { isPaid: true });

        // Add expense transaction
        await addTransaction({
            amount: ob.amount,
            categoryId: ob.categoryId,
            accountId: ob.accountId,
            description: `Pago: ${ob.description}`,
            date: new Date().toISOString().split('T')[0],
            type: 'expense'
        });
    }

    const updateBudget = async (categoryId: string, limit: number) => {
        if (!userId) return;
        // Check exist
        const existing = budgets.find(b => b.categoryId === categoryId);
        if (existing) {
            // Need ID to update? budgets table has ID. BUT local type Budget doesn't have ID!
            // We might need to query by category_id + user_id or change local type.
            // For now using delete+insert or update matching category_id
            await supabase.from('fp_budgets').update({ limit }).eq('user_id', userId).eq('category_id', categoryId);
        } else {
            await supabase.from('fp_budgets').insert({
                user_id: userId,
                category_id: categoryId,
                "limit": limit
            });
        }
        fetchData();
    }

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
        updateDebt: updateDebt, // Todo full impl
        deleteDebt,
        setSettings: updateSettings,
        balance,
        totalDebt,
        totalIncome: (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        totalExpense: (transactions || []).filter(t => t.type === 'expense' || t.type === 'debt_payment').reduce((s, t) => s + t.amount, 0)
    };
};
