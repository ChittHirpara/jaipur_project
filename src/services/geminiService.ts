import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ContextSnapshot {
  app_title: string;
  content: string;
  timestamp: number;
}

export interface CognitiveNode {
  id: number;
  app_title: string;
  intent: string;
  summary: string;
  timestamp: string;
  cluster_id: number;
}

export const geminiService = {
  async analyzeScreenshot(imageBase64: string, spokenContext: string = "") {
    const model = "gemini-3-flash-preview";
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `Analyze this screenshot of the user's workspace.
    Extract the cognitive context.
    ${spokenContext ? `\nCRITICAL CONTEXT: The user was recently heard saying: "${spokenContext}"\nIncorporate this spoken context into your analysis of their intent and summary.\n` : ''}
    Provide:
    1. app_title: The name of the main application visible (e.g., "VS Code", "Chrome", "Slack").
    2. content: A highly concise, informative AI summarization of the core activity, visible text, or code. Focus on the most critical information and strip away noise. Keep it under 2 sentences.
    3. intent: The underlying intent (e.g., "Debugging memory leak", "Drafting an email", "Reading documentation").
    4. cluster_id: A number 1-5 (1: Dev, 2: Business, 3: Research, 4: Communication, 5: Other).`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        },
        {
          text: promptText
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            app_title: { type: Type.STRING },
            content: { type: Type.STRING },
            intent: { type: Type.STRING },
            cluster_id: { type: Type.INTEGER },
          },
          required: ["app_title", "content", "intent", "cluster_id"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async analyzeContext(snapshot: ContextSnapshot) {
    const model = "gemini-3-flash-preview";
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze the following digital context snapshot and extract the user's cognitive state.
      
      App: ${snapshot.app_title}
      Content: ${snapshot.content}
      
      Provide:
      1. A concise summary of what they are doing.
      2. The underlying "Intent" (e.g., "Debugging memory leak", "Drafting investor pitch").
      3. A cluster ID (1-5) representing the general domain (1: Dev, 2: Business, 3: Research, 4: Communication, 5: Other).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            intent: { type: Type.STRING },
            cluster_id: { type: Type.INTEGER },
          },
          required: ["summary", "intent", "cluster_id"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    return response.embeddings?.[0]?.values || [];
  },

  async getRecall(query: string, history: any[]) {
    const model = "gemini-3-flash-preview";
    const contextStr = history.map(h => `[${h.timestamp}] ${h.app_title} - Intent: ${h.intent}\nSummary: ${h.content}`).join("\n\n");
    
    const response = await ai.models.generateContent({
      model,
      contents: `The user is asking: "${query}"
      
      Based on their recent cognitive history:
      ${contextStr}
      
      Provide a helpful response that restores their working memory. Be concise and professional.`,
    });

    return response.text;
  }
};
