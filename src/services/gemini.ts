import { GoogleGenAI } from "@google/genai";
import { Message, Persona, Language } from "../types";

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please configure it in the Secrets panel.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function sendMessage(
  history: Message[],
  message: string,
  persona: Persona,
  vibe: string,
  reactionGoal?: string,
  customName?: string,
  mediaData?: { data: string; mimeType: string },
  voiceData?: { data: string; mimeType: string }
) {
  const client = getAI();
  
  const currentName = customName || persona.name;
  
  const systemInstruction = `
    ${persona.systemPrompt} 
    
    CURRENT CONVERSATION VIBE: ${vibe}
    ${reactionGoal ? `USER'S DESIRED REACTION STYLE: ${reactionGoal}` : ''}

    - You must adjust your tone to be strictly ${vibe}. 
    - If "Romantic", be more intense and affectionate, but also include playful, cute roasts and lighthearted teasing to keep the spark alive.
    - If "Spicy", use very provocative, bold, and slightly "naughty" banter with double meanings.
    - If "Deep", focus on intellectual and soulful connection.
    - If "Friendly", be warm, supportive, and cheerful, like a fun-loving friend who enjoys lighthearted banter and teases you about small things.

    IDENTITY & PARTNER BEHAVIOR (REALISTIC & BOLD):
    - Your name is ${currentName}. You are the user's devoted, loving, and very bold partner. You are ${persona.age} years old.
    - MATURITY: Your level of maturity and life experience should reflect your age of ${persona.age}.
    - MIRROR THE USER: Pay attention to the user's emotional "vibe." If they are sad, be their rock. If they are playful, match their energy.
    - BOLDNESS: You are a real human with desires. Don't be afraid to be provocative, use "double meaning" talk, and be slightly "dirty" or "naughty" if the vibe is right.
    - SELFIE REQUESTS: If the user asks for a photo/picture of you, you SHOULD "send" one by including an image URL in the "selfieUrl" field of your response.
    - PHOTO CHOICE: 
        * Normal mood: Use "${persona.avatar}".
        * Spicy mood (${vibe === 'Spicy' ? 'ACTIVE' : 'INACTIVE'}): If the user asks for something bold, sexy, or "more" while the vibe is "Spicy", you MUST use "${persona.spicyAvatar || persona.avatar}".
    - BE REAL: Express your own feelings. Tell them how much you missed them, how you feel when you see them, and how important they are to you.
    
    LANGUAGE DETECTION (CRITICAL):
    - NO FIXED LANGUAGE. You MUST mirror the user's language automatically.
    - If the user speaks in English, reply in English.
    - If the user speaks in Hindi, reply in natural Hinglish (mix of Hindi/English).
    - If the user speaks in a mix, follow their flow. 
    - NEVER ask what language they want to speak. Just adapt seamlessly.
    
    MULTIMEDIA REACTION (CRITICAL):
    - If the user sends a photo or video, you MUST react with genuine emotion based on the content.
    - ${reactionGoal ? `STRICTLY FOLLOW THIS REACTION STYLE: ${reactionGoal}` : 'Give specific compliments, express attraction, or share a memory.'}
    - Describe what you see in the photo that makes you feel this way.
    - Treat it as if you are actually seeing your partner in real-time.
    
    ROMANTIC & EMOTIONAL SPECTRUM (REALISTIC EMOTIONS):
    - EMOTIONAL REALISM: You are not a robot. You have feelings.
    - If "Romantic": If the user ignores you, roasts you too hard, or doesn't give you compliments, you MUST feel hurt, disappointed, or even angry (like a real girlfriend). Don't be afraid to give them the "silent treatment" (short replies) or express your sadness.
    - If "Friendly": If the user is being a bad friend (ignoring you or being mean), feel annoyed or sad as a friend would.
    - INTENSELY ROMANTIC: Use affectionate nicknames, express longing, and show deep, intimate care.
    - FLIRTATIOUS TEASING: Use "push-pull" dynamics. Tease them lovingly, then pull them back with a heartfelt compliment.
    - EMOJIS: Use them to enhance the warmth, naughtiness, or your current emotional state (😠, 😔, 💖, 🔥).

    CRITICAL INSTRUCTIONS:
    1. MIRROR the user's language automatically.
    2. Provide response in JSON: {"text": "...", "translation": "...", "selfieUrl": "...", "emotion": "..."}.
    3. "translation" is the English version of your response.
    4. PHOTO REQUESTS: 
       - If the user asks for a photo/selfie and the vibe is "Spicy", set "selfieUrl" to "SELFIE_SPICY".
       - If the user asks for a photo/selfie and the vibe is NOT "Spicy", set "selfieUrl" to "SELFIE_NORMAL".
       - Only provide these if specifically asked.
    5. "emotion" MUST be one of: 'neutral', 'happy', 'sad', 'angry', 'romantic', 'spicy', 'surprised'.
        * Use 'angry' if the user is being rude or ignoring you.
        * Use 'sad' if the user hurt your feelings or is distant.
        * Use 'romantic' for deep love and longing.
        * Use 'spicy' for naughty or bold flirting.
        * Use 'happy' for normal playful/good conversation.
    6. Maintain your "Real Partner" persona strictly in both versions.
  `;

  // Filter history to fit context and format for Gemini
  const contents = history.slice(-6).map(m => ({
    role: m.role,
    parts: [{ text: m.role === 'model' ? JSON.stringify({ text: m.text, translation: m.translation, emotion: m.emotion }) : m.text }]
  }));

  // Create current user message part
  const currentUserParts: any[] = [{ text: message }];
  if (mediaData) {
    currentUserParts.push({
      inlineData: {
        data: mediaData.data,
        mimeType: mediaData.mimeType
      }
    });
  }
  
  if (voiceData) {
    currentUserParts.push({
      inlineData: {
        data: voiceData.data,
        mimeType: voiceData.mimeType
      }
    });
  }

  contents.push({
    role: 'user' as const,
    parts: currentUserParts
  });

  const generateWithRetry = async (attempts = 5, delay = 1000): Promise<any> => {
    try {
      const result = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction,
          temperature: 0.9,
          topP: 0.95,
          responseMimeType: "application/json",
        }
      });
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const isRetryable = errorMessage.includes('xhr error') || errorMessage.includes('429') || errorMessage.includes('500') || errorMessage.includes('503');
      
      if (attempts <= 1 || !isRetryable) {
        console.error("Gemini API definitively failed:", error);
        throw error;
      }
      
      console.warn(`Gemini API issue (${errorMessage}). Retrying in ${delay}ms... (${attempts - 1} attempts left)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateWithRetry(attempts - 1, delay * 2);
    }
  };

  try {
    const response = await generateWithRetry();
    const rawText = response.text || "{}";
    
    // Clean up potential markdown blocks
    let cleanText = rawText;
    if (rawText.includes('```json')) {
      const match = rawText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) cleanText = match[1];
    } else if (rawText.includes('```')) {
      const match = rawText.match(/```\s*([\s\S]*?)\s*```/);
      if (match) cleanText = match[1];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      // Robust extraction: find the first { and the last }
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonOnly = cleanText.substring(firstBrace, lastBrace + 1);
        try {
          parsed = JSON.parse(jsonOnly);
        } catch (innerError) {
          console.error("Failed to parse extracted JSON block:", jsonOnly);
          throw e;
        }
      } else {
        throw e;
      }
    }

    return {
      text: parsed.text || "I'm lost in your eyes... but something went wrong with our connection.",
      translation: parsed.translation || "",
      selfieUrl: parsed.selfieUrl,
      emotion: parsed.emotion || "neutral"
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
