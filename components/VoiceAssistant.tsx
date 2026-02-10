
import React, { useState, useEffect } from 'react';
import { parseVoiceCommand } from '../services/geminiService';
import { Category, Account, Transaction } from '../types';

interface VoiceAssistantProps {
    categories: Category[];
    accounts: Account[];
    currency: string;
    geminiApiKey?: string;
    onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ categories, accounts, currency, geminiApiKey, onAddTransaction }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [parsedData, setParsedData] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // @ts-ignore
    const recognition = window.SpeechRecognition || window.webkitSpeechRecognition
        ? // @ts-ignore
        new (window.SpeechRecognition || window.webkitSpeechRecognition)()
        : null;

    useEffect(() => {
        if (!recognition) return;

        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            handleVoiceData(text);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };
    }, [recognition]);

    const startListening = () => {
        if (!recognition) {
            alert("Tu navegador no soporta el reconocimiento de voz.");
            return;
        }
        setTranscript('');
        setParsedData(null);
        setIsListening(true);
        recognition.start();
    };

    const handleVoiceData = async (text: string) => {
        if (!geminiApiKey) {
            alert("Por favor, configura tu Gemini API Key en Ajustes primero.");
            return;
        }
        setIsProcessing(true);
        setShowModal(true);
        const result = await parseVoiceCommand(text, categories, accounts, currency, geminiApiKey);
        setParsedData(result);
        setIsProcessing(false);
    };

    const handleConfirm = () => {
        if (parsedData) {
            onAddTransaction({
                amount: parsedData.amount,
                categoryId: parsedData.categoryId,
                accountId: parsedData.accountId,
                description: parsedData.description,
                date: parsedData.date,
                type: parsedData.type
            });
            setShowModal(false);
            setParsedData(null);
            setTranscript('');
        }
    };

    return (
        <>
            {/* Botón Flotante */}
            <button
                onClick={startListening}
                className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl z-40 flex items-center justify-center transition-all active:scale-90 ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white text-2xl border-4 border-white`}
            >
                {isListening ? '🛑' : '🎙️'}
            </button>

            {/* Modal de Confirmación */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Voz a Movimiento</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100"
                            >✕</button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Escuché:</p>
                                <p className="text-slate-700 font-bold italic">"{transcript || 'Escuchando...'}"</p>
                            </div>

                            {isProcessing ? (
                                <div className="flex flex-col items-center py-10">
                                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gemini Procesando...</p>
                                </div>
                            ) : parsedData ? (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                                                {parsedData.type === 'expense' ? 'Gasto Detectado' : 'Ingreso Detectado'}
                                            </p>
                                            <p className="text-3xl font-black text-indigo-900">{currency}{parsedData.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-indigo-900 uppercase">{parsedData.description}</p>
                                            <p className="text-[10px] font-bold text-indigo-400">{parsedData.date}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Categoría</p>
                                            <p className="font-bold text-slate-800 truncate">
                                                {categories.find(c => c.id === parsedData.categoryId)?.name || 'Otros'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Cuenta</p>
                                            <p className="font-bold text-slate-800 truncate">
                                                {accounts.find(a => a.id === parsedData.accountId)?.name || 'Principal'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleConfirm}
                                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                                    >
                                        Confirmar Registro
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-10 space-y-4">
                                    <p className="text-slate-400 font-bold text-sm">No pude entender bien el monto o el tipo de gasto. Intenta algo como:</p>
                                    <p className="bg-indigo-50 text-indigo-600 p-3 rounded-xl text-xs font-bold italic">"Gaste cincuenta mil pesos en comida con mi tarjeta"</p>
                                    <button
                                        onClick={startListening}
                                        className="text-indigo-600 font-black uppercase text-xs tracking-widest mt-4"
                                    >Reintentar 🔄</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VoiceAssistant;
