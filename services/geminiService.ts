import { GoogleGenAI, Modality } from "@google/genai";
import { base64ToImageData, blobToBase64 } from '../utils/imageUtils';

export const transformImageWithGemini = async (userImageBase64: string, patternImageUrl: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
  }
  
  // Fetch and convert pattern image to base64
  const patternResponse = await fetch(patternImageUrl);
  if (!patternResponse.ok) {
    throw new Error(`Failed to fetch pattern image: ${patternResponse.statusText}`);
  }
  const patternBlob = await patternResponse.blob();
  const patternBase64 = await blobToBase64(patternBlob);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const userImagePart = base64ToImageData(userImageBase64);
  const patternImagePart = base64ToImageData(patternBase64);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: userImagePart.data,
            mimeType: userImagePart.mimeType,
          },
        },
        {
          inlineData: {
            data: patternImagePart.data,
            mimeType: patternImagePart.mimeType,
          },
        },
        {
          text: `Task: Image modification using a pattern to create traditional Chinese ink painting style with 30% top space.
Instructions:
1. You are given two images. The first image contains a person. The second image contains a texture or pattern.
2. Identify the main person in the first image.
3. Replace their clothing with an elegant ancient Chinese costume (古裝) in traditional Chinese ink painting style (水墨画风格, 中國国风繪畫風格).
4. The new costume's texture, pattern, and color scheme MUST be derived from the second image provided.
5. 人物樣貌變成中國国风繪畫風格, 水墨画风格, Preserve the original face, hair, and pose of the person.
6. Set the entire background to a solid, pure green color for chroma keying.
7. CRITICAL: Leave exactly 35% space at the top of the image with NO content - completely empty space. This is for adding text or other elements later.
8. CRITICAL RULE: DO NOT add any extra objects, elements, or graphics from the second image into the final output. Only use it as a source for the clothing pattern. The output must only contain the modified person against the green background.
Output: Your response must contain ONLY the modified image in traditional Chinese ink painting style with exactly 35% empty space at the top. Do not include any text.
圖片風格必需是中國風水墨畫風格`,
        },
      ],
    },
    config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const newMimeType = part.inlineData.mimeType;
      const newImageData = part.inlineData.data;
      return `data:${newMimeType};base64,${newImageData}`;
    }
  }

  const aiTextResponse = response.text?.trim();
  const errorMessage = aiTextResponse 
    ? `AI did not return an image. AI's response: "${aiTextResponse}"`
    : "AI did not return an image and provided no text explanation. The request may have been blocked.";
  throw new Error(errorMessage);
};