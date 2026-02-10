
import React, { useState, useEffect } from 'react';
import { parseVoiceCommand, chatWithFinances } from '../services/geminiService';
import { Category, Account, Transaction, Debt, Obligation } from '../types';

interface VoiceAssistantProps {
    categories: Category[];
    accounts: Account[];
    transactions: Transaction[];
    debts: Debt[];
    obligations: Obligation[];
    currency: string;
    geminiApiKey?: string;
    onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
    categories, accounts, transactions, debts, obligations, currency, geminiApiKey, onAddTransaction
}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [parsedData, setParsedData] = useState<any>(null);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [mode, setMode] = useState<'create' | 'chat'>('create');
    const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
    const [textInput, setTextInput] = useState('');

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
            processCommand(text);
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
    }, [recognition, mode]);

    const processCommand = async (text: string) => {
        if (!geminiApiKey) {
            alert("Configura tu API Key en Ajustes.");
            return;
        }

        setIsProcessing(true);
        setShowModal(true);

        // Heurística simple: si la frase tiene números probablemente es un registro, 
        // si es una pregunta ("cuanto", "cuando", "recomienda") es chat.
        const lowerText = text.toLowerCase();
        const isQuestion = lowerText.includes('cuánto') || lowerText.includes('cuanto') ||
            lowerText.includes('cuando') || lowerText.includes('cuándo') ||
            lowerText.includes('qué') || lowerText.includes('que') ||
            lowerText.includes('recomienda') || lowerText.includes('consejo');

        if (isQuestion) {
            setMode('chat');
            const response = await chatWithFinances(text, {
                transactions, budgets: [], debts, obligations, currency, apiKey: geminiApiKey
            });
            setAiResponse(response);
        } else {
            setMode('create');
            const result = await parseVoiceCommand(text, categories, accounts, currency, geminiApiKey);
            setParsedData(result);
        }

        setIsProcessing(false);
    };

    const startListening = () => {
        if (!recognition) {
            alert("Tu navegador no soporta el reconocimiento de voz.");
            return;
        }
        setTranscript('');
        setParsedData(null);
        setAiResponse(null);
        setIsListening(true);
        recognition.start();
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
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (textInput.trim()) {
            processCommand(textInput);
            setTextInput('');
        }
    };

    return (
        <>
            {/* Botón Flotante Principal */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl z-40 flex items-center justify-center bg-indigo-600 hover:bg-slate-900 text-white text-2xl border-4 border-white transition-all active:scale-95"
            >
                ✨
            </button>

            {/* Modal del Asistente */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">

                        {/* Header con Tabs */}
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setActiveTab('voice')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                                >Hablar</button>
                                <button
                                    onClick={() => setActiveTab('text')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                                >Escribir</button>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"
                            >✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">

                            {activeTab === 'voice' ? (
                                <div className="text-center space-y-4">
                                    <button
                                        onClick={startListening}
                                        className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl transition-all mx-auto ${isListening ? 'bg-rose-500 animate-pulse text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 shadow-inner'}`}
                                    >
                                        {isListening ? '🛑' : '🎙️'}
                                    </button>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {isListening ? 'Escuchando tu voz...' : 'Toca para hablar'}
                                    </p>
                                    <p className="text-slate-500 text-sm italic italic">
                                        "{transcript || 'Prueba: "¿Cuánto le debo a Bancolombia?"'}"
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleTextSubmit} className="space-y-4">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 focus-within:border-indigo-500 transition-all">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tu pregunta o registro</p>
                                        <textarea
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            placeholder="Ej: ¿Qué pagos tengo pendientes para esta semana?"
                                            className="w-full bg-transparent border-none outline-none font-bold text-slate-900 resize-none h-24"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all"
                                    >Consultar con IA</button>
                                </form>
                            )}

                            {/* Resultados */}
                            {isProcessing && (
                                <div className="flex flex-col items-center py-10 animate-pulse">
                                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Consultando con Gemini...</p>
                                </div>
                            )}

                            {aiResponse && (
                                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] space-y-4 animate-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">🤖</span>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Respuesta de la IA</p>
                                    </div>
                                    <div className="text-slate-800 text-sm leading-relaxed prose prose-sm prose-slate max-w-none font-medium">
                                        {aiResponse.split('\n').map((line, i) => (
                                            <p key={i} className="mb-2 last:mb-0">{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {parsedData && (
                                <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] space-y-6 animate-in slide-in-from-bottom-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Registro Encontrado</p>
                                            <p className="text-3xl font-black text-indigo-900">{currency}{parsedData.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-indigo-900 truncate max-w-[120px]">{parsedData.description}</p>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase">{parsedData.date}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleConfirm}
                                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                                    >Confirmar Registro</button>
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
