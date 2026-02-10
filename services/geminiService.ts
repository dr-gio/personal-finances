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

  // Usamos el modelo 2.0 flash que es el confirmado disponible para esta cuenta
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Limpiar los datos para no enviar imágenes base64 (que causan el error de exceso de tokens)
  const cleanTransactions = data.transactions.slice(0, 30).map(t => ({
    fecha: t.date,
    monto: t.amount,
    descripcion: t.description,
    tipo: t.type
  }));

  const cleanBudgets = data.budgets.map(b => ({
    categoria: b.categoryId,
    limite: b.limit
  }));

  const cleanDebts = data.debts.map(d => ({
    nombre: d.name,
    monto_restante: d.remainingAmount,
    tasa: d.interestRate
  }));

  const prompt = `
    Actúa como un asesor financiero experto y motivador para la app FINANZAS PRO.
    Analiza los datos del usuario y proporciona consejos prácticos en español.
    
    DATOS PROPORCIONADOS:
    - Moneda: ${data.currency}
    - Movimientos recientes: ${JSON.stringify(cleanTransactions)}
    - Presupuestos: ${JSON.stringify(cleanBudgets)}
    - Deudas: ${JSON.stringify(cleanDebts)}

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

export const parseVoiceCommand = async (text: string, categories: any[], accounts: any[], currency: string, apiKey: string) => {
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Eres un procesador de lenguaje natural para la app FINANZAS PRO.
    Tu tarea es convertir una frase de voz en un objeto JSON de transacción.
    
    FRASE DEL USUARIO: "${text}"
    
    DATOS DE REFERENCIA:
    - Categorías disponibles: ${categories.map(c => `${c.id} (${c.name})`).join(", ")}
    - Cuentas disponibles: ${accounts.map(a => `${a.id} (${a.name})`).join(", ")}
    - Moneda: ${currency}
    - Fecha de hoy: ${new Date().toISOString().split('T')[0]}

    REGLAS DE RETORNO (JSON PURO):
    1. "type": 'income' o 'expense'
    2. "amount": número positivo
    3. "categoryId": el ID de la categoría que mejor encaje (usa '1' para Alimentación, '3' para transporte, etc. según los IDs dados)
    4. "accountId": el ID de la cuenta mencionada (usa '${accounts[0]?.id || ""}' si no se menciona)
    5. "description": una descripción breve y limpia
    6. "date": la fecha en formato YYYY-MM-DD (asume hoy si no se menciona)

    DEVOLVER SOLO EL JSON, sin explicaciones ni markdown. Si no entiendes el monto, devuelve null.
    Ejemplo de salida: {"type":"expense", "amount":50000, "categoryId":"1", "accountId":"a1", "description":"Cena con amigos", "date":"2026-02-10"}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonStr = response.text().trim().replace(/```json/g, "").replace(/```/g, "");
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing voice command:", error);
    return null;
  }
};