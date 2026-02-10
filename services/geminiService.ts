import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeFinances = async (data: {
  transactions: any[];
  budgets: any[];
  debts: any[];
  currency: string;
  apiKey?: string;
}) => {
  const apiKey = data.apiKey || "";

  if (!apiKey) {
    console.warn("Gemini API Key is missing");
    return "Para utilizar el asistente de IA, por favor configura tu API Key de Gemini en la sección de Ajustes.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    3. "categoryId": el ID de la categoría que mejor encaje
    4. "accountId": el ID de la cuenta mencionada (usa '${accounts[0]?.id || ""}' si no se menciona)
    5. "description": una descripción breve y limpia
    6. "date": la fecha en formato YYYY-MM-DD (asume hoy si no se menciona)

    DEVOLVER SOLO EL JSON, sin explicaciones ni markdown. Si no entiendes el monto, devuelve null.
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

export const chatWithFinances = async (query: string, data: {
  transactions: any[];
  budgets: any[];
  debts: any[];
  obligations: any[];
  currency: string;
  apiKey: string;
}) => {
  if (!data.apiKey) return "Configura tu API Key en Ajustes.";

  const genAI = new GoogleGenerativeAI(data.apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const cleanTransactions = data.transactions.slice(0, 50).map(t => ({
    fecha: t.date,
    monto: t.amount,
    desc: t.description,
    tipo: t.type
  }));

  const cleanObligations = data.obligations.map(o => ({
    desc: o.description,
    monto: o.amount,
    fecha: o.dueDate,
    pagado: o.isPaid
  }));

  const prompt = `
    Eres "FinanzaPro AI", un asistente financiero experto. 
    Responde la pregunta del usuario usando su contexto financiero:

    PREGUNTA: "${query}"

    CONTEXTO:
    - Moneda: ${data.currency}
    - Movimientos: ${JSON.stringify(cleanTransactions)}
    - Deudas: ${JSON.stringify(data.debts.map(d => ({ nombre: d.name, saldo: d.remainingAmount })))}
    - Próximos Pagos: ${JSON.stringify(cleanObligations)}
    - Fecha Hoy: ${new Date().toISOString().split('T')[0]}

    REGLAS:
    - Responde en ESPAÑOL.
    - Sé breve y usa Markdown.
    - Si preguntan por pagos pendientes, revisa "Próximos Pagos".
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return "Error al conectar con la IA.";
  }
};