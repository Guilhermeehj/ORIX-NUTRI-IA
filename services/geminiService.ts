import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysis } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING, description: "Análise técnica do prato considerando o objetivo do usuário. Seja direto." },
    nutritionalInfo: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.STRING, description: "Estimativa de calorias (ex: '450 kcal')" },
        protein: { type: Type.STRING },
        carbs: { type: Type.STRING },
        fat: { type: Type.STRING },
        weight: { type: Type.STRING, description: "Estimativa do peso total do prato (ex: '350g')" },
        vitamins: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de vitaminas principais presentes (ex: ['Vit A', 'Vit C'])" },
        minerals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de minerais principais presentes (ex: ['Ferro', 'Cálcio'])" }
      }
    },
    suggestedRecipe: {
        type: Type.OBJECT,
        description: "Uma sugestão de receita completa baseada no prato ou uma alternativa saudável para o objetivo.",
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING, description: "Breve introdução apetitosa sobre o prato sugerido." },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 dicas essenciais de preparo ou saúde para este prato." },
            imageKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Palavras-chave VISUAIS EM INGLÊS para gerar uma imagem fotorealista (ex: 'grilled salmon, cinematic lighting, 4k')." }
        }
    }
  },
  required: ["description", "nutritionalInfo"]
};

const SYSTEM_INSTRUCTION = `Você é a NutriAI, o núcleo de inteligência nutricional do sistema ORIX.
Sua função é analisar imagens de alimentos e fornecer dados precisos (Calorias, Peso, Macros, Vitaminas e Minerais).
Sempre considere o OBJETIVO do usuário (Emagrecer, Ganhar Massa, etc) ao fazer seus comentários sobre o prato.
Ao sugerir a receita, forneça dicas úteis e palavras-chave visuais detalhadas para geração de imagem.
Seja futurista, direto e preciso.`;

export const analyzeFoodImage = async (base64Image: string, mimeType: string, userGoal: string, userCorrection?: string): Promise<Omit<FoodAnalysis, 'imageUri'>> => {
  try {
    let promptText = `O usuário tem o seguinte objetivo físico: "${userGoal}". 
    Analise este prato visualmente. Estime o peso total, calorias, macros e micronutrientes (vitaminas/minerais) principais. 
    Diga se este prato está alinhado com o objetivo de "${userGoal}".`;
    
    if (userCorrection) {
      promptText = `ATENÇÃO: A identificação anterior pode estar incorreta. O usuário informou que este prato é: "${userCorrection}". 
      O objetivo do usuário é: "${userGoal}".
      Baseie sua análise nutricional e descrição EXCLUSIVAMENTE nesta informação fornecida pelo usuário ("${userCorrection}") e na imagem visual. Recalcule tudo para este alimento correto.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: promptText }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("O sistema não retornou dados de análise.");
    }

    // Sanitize response: remove markdown code blocks if present (e.g. ```json ... ```)
    const cleanJson = textResponse.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();

    try {
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse JSON:", cleanJson);
      throw new Error("Erro ao processar dados da análise.");
    }
  } catch (error) {
    console.error("Erro ao analisar imagem:", error);
    throw error;
  }
};