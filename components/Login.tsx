import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (isRegistering) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('¡Cuenta creada! Por favor revisa tu correo para confirmar (si es necesario) o inicia sesión.');
                setIsRegistering(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onLogin();
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />

            <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 w-full max-w-md border border-slate-100 relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-[2rem] mb-6 text-4xl shadow-sm">
                        💎
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">FINANZAS PRO</h1>
                    <p className="text-slate-400 font-medium text-sm">Tu patrimonio, bajo control.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                            placeholder="ejemplo@correo.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 rounded-xl animate-pulse">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="text-emerald-500 text-xs font-bold text-center bg-emerald-50 py-2 rounded-xl">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-80 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <span className="animate-pulse">Procesando...</span>
                        ) : (
                            isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-xs text-slate-400 font-medium hover:text-indigo-600 transition-colors"
                    >
                        {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
