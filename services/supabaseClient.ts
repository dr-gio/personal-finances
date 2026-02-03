
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos (simplificados)
export type DbTransaction = {
    id: string;
    amount: number;
    category_id: string;
    account_id: string;
    target_account_id?: string;
    debt_id?: string;
    description: string;
    date: string;
    type: string;
    user_id: string;
    attachments?: any[];
};
