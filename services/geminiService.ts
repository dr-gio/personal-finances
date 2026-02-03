
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFinances = async (data: {
  transactions: any[];
  budgets: any[];
  debts: any[];
  currency: string;
}) => {
  const prompt = `
    Como un experto asesor financiero senior, analiza los siguientes datos de la aplicación FINANZAS PRO y proporciona consejos accionables.
    
    DATOS:
    - Movimientos recientes: ${JSON.stringify(data.transactions.slice(0, 30))}
    - Presupuestos: ${JSON.stringify(data.budgets)}
    - Deudas: ${JSON.stringify(data.debts)}
    - Moneda: ${data.currency}

    PROPORCIONA:
    1. Un resumen breve del estado de salud financiera actual (Excelente, Bueno, Regular, Crítico).
    2. Identificación de patrones de gasto inusuales o excesivos.
    3. 3 consejos específicos para reducir gastos basados en las categorías más altas.
    4. Un comentario sobre la gestión de deudas.

    Formato: Responde con un tono motivador pero profesional. Usa Markdown para el formato. Máximo 300 palabras.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "No pude realizar el análisis en este momento. Por favor, intenta más tarde.";
  }
};