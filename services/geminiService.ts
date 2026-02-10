import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeFinances = async (data: {
  transactions: any[];
  budgets: any[];
  debts: any[];
  currency: string;
  apiKey?: string;
}) => {
  // Priorizar la API Key pasada por argumento (desde settings en Supabase)
  const apiKey = data.apiKey || "";

  if (!apiKey) {
    console.warn("Gemini API Key is missing");
    return "Para utilizar el asistente de IA, por favor configura tu API Key de Gemini en la sección de Ajustes.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Usamos el modelo 1.5 flash que es el más compatible y estable globalmente
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Actúa como un asesor financiero experto y motivador para la app FINANZAS PRO.
    Analiza los datos del usuario y proporciona consejos prácticos en español.
    
    DATOS PROPORCIONADOS:
    - Moneda: ${data.currency}
    - Movimientos (últimos 30): ${JSON.stringify(data.transactions.slice(0, 30))}
    - Presupuestos: ${JSON.stringify(data.budgets)}
    - Deudas: ${JSON.stringify(data.debts)}

    POR FAVOR INCLUYE:
    1. Un diagnóstico rápido de salud financiera.
    2. Identificación de fugas de dinero o gastos excesivos.
    3. 3 recomendaciones de ahorro específicas.
    4. Un mensaje de motivación para mejorar el control financiero.
    
    REGLAS:
    - Usa un tono profesional pero cercano.
    - Formato Markdown (negritas, listas, etc).
    - Máximo 250 palabras.
    - Responde siempre en ESPAÑOL.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error: any) {
    console.error("Error en el análisis de Gemini:", error);

    let userMessage = "No pude conectar con el asistente de IA. ";

    if (error.message?.includes("API key not valid")) {
      userMessage = "⚠️ La API Key no es válida. Por favor, verifica en Google AI Studio.";
    } else if (error.message?.includes("Safety")) {
      userMessage = "⚠️ El análisis fue bloqueado por filtros de seguridad de Google.";
    } else {
      userMessage += "Detalle: " + (error.message || "Error desconocido");
    }

    return userMessage;
  }
};