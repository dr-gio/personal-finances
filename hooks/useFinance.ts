
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
        accentColor: '#f59e0b',
        logo: ''
    });
    const [userId, setUserId] = useState<string | null>(null);

    const getUserId = async () => {
        if (userId) return userId;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUserId(session.user.id);
            return session.user.id;
        }
        return null;
    };

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
                    logo: settingsData.logo || ''
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

    //Helper to update accounts logic
    const updateAccountBalances = async (t: Omit<Transaction, 'id'>) => {
        const accIds = [t.accountId];
        if (t.targetAccountId) accIds.push(t.targetAccountId);

        const { data: currentAccounts } = await supabase
            .from('fp_accounts')
            .select('*')
            .in('id', accIds);

        if (!currentAccounts) return;

        for (const acc of currentAccounts) {
            let newBalance = parseFloat(acc.balance);

            if (acc.id === t.accountId) {
                if (t.type === 'income') {
                    newBalance += t.amount;
                } else {
                    newBalance -= t.amount;
                }
            }

            if (t.type === 'transfer' && acc.id === t.targetAccountId) {
                newBalance += t.amount;
            }

            const { error } = await supabase
                .from('fp_accounts')
                .update({ balance: newBalance })
                .eq('id', acc.id);

            if (error) console.error("Error updating balance", error);
        }
    }

    // --- ACTIONS ---

    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        const uid = await getUserId();
        if (!uid) {
            alert("Error de sesión: No se pudo identificar al usuario.");
            return;
        }

        try {
            const { error: txError } = await supabase.from('fp_transactions').insert({
                user_id: uid,
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

            if (txError) throw txError;

            // Optimistic update for UI immediate feedback
            setAccounts(prev => prev.map(acc => {
                if (acc.id === t.accountId) {
                    if (t.type === 'income') return { ...acc, balance: (acc.balance || 0) + t.amount };
                    return { ...acc, balance: (acc.balance || 0) - t.amount };
                }
                if (t.type === 'transfer' && acc.id === t.targetAccountId) {
                    return { ...acc, balance: (acc.balance || 0) + t.amount };
                }
                return acc;
            }));

            await updateAccountBalances(t);
            fetchData();

        } catch (e: any) {
            console.error("Error adding transaction", e);
            alert("Error al guardar transacción: " + e.message);
        }
    };

    const deleteTransaction = async (id: string) => {
        const uid = await getUserId();
        if (!uid) return;

        // Revert balance effect
        const { data: tx } = await supabase.from('fp_transactions').select('*').eq('id', id).single();
        if (tx) {
            const amount = parseFloat(tx.amount);
            const { data: acc } = await supabase.from('fp_accounts').select('*').eq('id', tx.account_id).single();
            if (acc) {
                let reversedBalance = parseFloat(acc.balance);
                if (tx.type === 'expense' || tx.type === 'debt_payment') reversedBalance += amount;
                else if (tx.type === 'income') reversedBalance -= amount;

                await supabase.from('fp_accounts').update({ balance: reversedBalance }).eq('id', acc.id);
            }
        }

        const { error } = await supabase.from('fp_transactions').delete().eq('id', id);
        if (error) alert("Error eliminando: " + error.message);
        else fetchData();
    };

    const updateTransaction = async (id: string, t: Omit<Transaction, 'id'>) => {
        const { error } = await supabase.from('fp_transactions').update({
            amount: t.amount,
            category_id: t.categoryId,
            account_id: t.accountId,
            description: t.description,
            date: t.date,
            type: t.type,
        }).eq('id', id);

        if (error) alert("Error actualizando: " + error.message);
        else fetchData();
    };

    const addAccount = async (a: Omit<Account, 'id'>) => {
        const uid = await getUserId();
        if (!uid) return;
        const { error } = await supabase.from('fp_accounts').insert({
            user_id: uid,
            name: a.name,
            type: a.type,
            balance: a.balance,
            color: a.color,
            icon: a.icon
        });
        if (error) alert("Error creando cuenta: " + error.message);
        fetchData();
    };

    const updateAccount = async (id: string, a: Partial<Account>) => {
        const { error } = await supabase.from('fp_accounts').update(a).eq('id', id);
        if (error) alert("Error actualizando cuenta: " + error.message);
        fetchData();
    }

    const deleteAccount = async (id: string) => {
        const { error } = await supabase.from('fp_accounts').delete().eq('id', id);
        if (error) alert("Error eliminando cuenta: " + error.message);
        fetchData();
    }

    const addCategory = async (c: Omit<Category, 'id'>) => {
        const uid = await getUserId();
        if (!uid) return;

        const { error } = await supabase.from('fp_categories').insert({
            user_id: uid,
            name: c.name,
            color: c.color,
            icon: c.icon
        });
        if (error) alert("Error creando categoría: " + error.message);
        fetchData();
    }

    const updateCategory = async (id: string, c: Partial<Category>) => {
        const { error } = await supabase.from('fp_categories').update(c).eq('id', id);
        if (error) alert("Error: " + error.message);
        fetchData();
    }

    const deleteCategory = async (id: string) => {
        const { error } = await supabase.from('fp_categories').delete().eq('id', id);
        if (error) alert("Error: " + error.message);
        fetchData();
    }

    // Settings
    const updateSettings = async (newSettings: AppSettings) => {
        const uid = await getUserId();
        if (!uid) {
            alert("No se pudo guardar la configuración: Sesión no válida.");
            return;
        }

        const { error } = await supabase.from('fp_settings').upsert({
            user_id: uid,
            user_name: newSettings.userName,
            currency: newSettings.currency,
            primary_color: newSettings.primaryColor,
            secondary_color: newSettings.secondaryColor,
            accent_color: newSettings.accentColor,
            logo: newSettings.logo
        });
        if (error) {
            alert("Error guardando configuración: " + error.message);
        } else {
            setSettings(newSettings);
        }
    };

    // Debts & Budgets handlers
    const addDebt = async (d: Omit<Debt, 'id'>) => {
        const uid = await getUserId();
        if (!uid) return;

        await supabase.from('fp_debts').insert({
            user_id: uid,
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
        // Simplified update
        // Note: In real app check fields mapping
    }

    const deleteDebt = async (id: string) => {
        await supabase.from('fp_debts').delete().eq('id', id);
        fetchData();
    }

    const addObligation = async (o: Omit<Obligation, 'id' | 'isPaid'>) => {
        const uid = await getUserId();
        if (!uid) return;

        await supabase.from('fp_obligations').insert({
            user_id: uid,
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
            is_paid: o.isPaid
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

        await updateObligation(id, { isPaid: true });

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
        const uid = await getUserId();
        if (!uid) return;

        const existing = budgets.find(b => b.categoryId === categoryId);
        if (existing) {
            await supabase.from('fp_budgets').update({ limit }).eq('user_id', uid).eq('category_id', categoryId);
        } else {
            await supabase.from('fp_budgets').insert({
                user_id: uid,
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
        updateDebt: updateDebt,
        deleteDebt,
        setSettings: updateSettings,
        balance,
        totalDebt,
        totalIncome: (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        totalExpense: (transactions || []).filter(t => t.type === 'expense' || t.type === 'debt_payment').reduce((s, t) => s + t.amount, 0)
    };
};
