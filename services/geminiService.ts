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

  // Usamos el modelo flash 2.0 que es rápido y potente
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    if (error.message?.includes("API key not valid")) {
      return "⚠️ La API Key que ingresaste en Ajustes no es válida. Por favor, genera una nueva en Google AI Studio.";
    }

    return "No pude conectar con el asistente de IA en este momento. Por favor, verifica tu conexión a internet o que tu API Key sea correcta.";
  }
};