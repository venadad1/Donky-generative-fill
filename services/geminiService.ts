import { GoogleGenAI } from "@google/genai";

/**
 * Sends the image (with the masked area erased/transparent) and the prompt to Gemini.
 */
export const generateFill = async (
  imageDataBase64: string,
  prompt: string
): Promise<string> => {
  // Retrieve API Key from global process (Node) or window.process (Browser/Netlify injection)
  const apiKey = (typeof process !== "undefined" ? process.env.API_KEY : undefined) || 
                 (window as any).process?.env?.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // We clean the base64 string if it includes the data prefix
  const cleanBase64 = imageDataBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png',
            },
          },
          {
            text: `Edit this image. Fill the transparent/empty areas (or the area described) with: ${prompt}. Ensure the lighting and perspective match the original image seamlessley.`,
          },
        ],
      },
    });

    // The API might return text if it refuses, or an image part.
    // We need to find the image part.
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
        throw new Error("No response from AI.");
    }

    const content = candidates[0].content;
    
    let generatedImageBase64 = null;

    // Iterate through parts to find the image
    if (content.parts) {
        for (const part of content.parts) {
            if (part.inlineData && part.inlineData.data) {
                generatedImageBase64 = part.inlineData.data;
                break;
            }
        }
    }

    if (!generatedImageBase64) {
        // If no image found, check if there is text explaining why
        const textPart = content.parts.find(p => p.text);
        if (textPart) {
            throw new Error(`AI Response (Text only): ${textPart.text}`);
        }
        throw new Error("AI did not return an image.");
    }

    return `data:image/png;base64,${generatedImageBase64}`;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};