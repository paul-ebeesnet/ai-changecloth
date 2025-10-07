import { GoogleGenAI, Modality } from "@google/genai";
import { base64ToImageData, blobToBase64 } from '../utils/imageUtils';

interface UserSettings {
  apiKey: string;
  apiProvider: 'gemini' | 'openrouter';
  selectedModel: string;
}

export const transformImageWithAI = async (
  userImageBase64: string, 
  patternImageUrl: string, 
  settings?: UserSettings
): Promise<string> => {
  // Use saved settings from localStorage if not provided
  const savedSettings = settings || JSON.parse(localStorage.getItem('userSettings') || '{}');
  
  const apiKey = savedSettings.apiKey || process.env.GEMINI_API_KEY;
  const apiProvider = savedSettings.apiProvider || 'gemini';
  const selectedModel = savedSettings.selectedModel || 'gemini-2.5-flash-image-preview';
  
  if (!apiKey) {
    throw new Error("API 金鑰未設定。請到設定頁面輸入您的 API 金鑰。");
  }
  
  // Fetch and convert pattern image to base64
  const patternResponse = await fetch(patternImageUrl);
  if (!patternResponse.ok) {
    throw new Error(`無法獲取樣式圖片: ${patternResponse.statusText}`);
  }
  const patternBlob = await patternResponse.blob();
  const patternBase64 = await blobToBase64(patternBlob);

  // Prepare the prompt
  const prompt = `Task: Image modification using a pattern to create traditional Chinese ink painting style with 30% top space.
Instructions:
1. You are given two images. The first image contains a person. The second image contains a texture or pattern.
2. Identify the main person in the first image.
3. Convert the ENTIRE person (including face, hair, hands, and all visible body parts) to traditional Chinese ink painting style (水墨画风格, 中國国风繪畫風格).
4. Replace their clothing with an elegant ancient Chinese costume (古裝) in traditional Chinese ink painting style (水墨画风格, 中國国风繪畫風格).
5. The new costume's texture, pattern, and color scheme MUST be derived from the second image provided.
6. Ensure that ALL aspects of the person (facial features, hair, skin texture, hands, etc.) are rendered in the traditional Chinese ink painting artistic style.
7. CRITICAL: MAINTAIN NATURAL COLOR PALETTE - DO NOT convert the image to black and white or grayscale. Preserve the original color tones while applying the ink painting style.
8. Preserve the original pose of the person but enhance all visual elements to match the ink painting aesthetic.
9. Set the entire background to a solid, pure green color for chroma keying.
10. CRITICAL: Leave exactly 30% space at the top of the image with NO content - completely empty space. This is for adding text or other elements later.
11. CRITICAL RULE: DO NOT add any extra objects, elements, or graphics from the second image into the final output. Only use it as a source for the clothing pattern. The output must only contain the modified person against the green background.
Output: Your response must contain ONLY the modified image in traditional Chinese ink painting style with exactly 30% empty space at the top. Do not include any text.`;

  if (apiProvider === 'gemini') {
    return transformWithGemini(userImageBase64, patternBase64, apiKey, selectedModel, prompt);
  } else {
    return transformWithOpenRouter(userImageBase64, patternBase64, apiKey, selectedModel, prompt);
  }
};

const transformWithGemini = async (
  userImageBase64: string,
  patternBase64: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const userImagePart = base64ToImageData(userImageBase64);
  const patternImagePart = base64ToImageData(patternBase64);

  try {
    const response = await ai.models.generateContent({
      model,
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
            text: prompt,
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
      ? `AI 未返回圖片。AI 的回應: "${aiTextResponse}"`
      : "AI 未返回圖片且未提供文字說明。請求可能被阻止。";
    throw new Error(errorMessage);
  } catch (error: any) {
    // Check if this is a region restriction error
    if (error.message && error.message.includes("User location is not supported")) {
      throw new Error("抱歉，您所在的地區暫時不支持AI換裝功能。請嘗試在其他地區訪問此應用，或聯繫管理員。");
    }
    
    // Check if this is a quota exceeded error
    if (error.message && error.message.includes("quota") && error.message.includes("exceeded")) {
      throw new Error("您的 Google AI API 配額已用完。請嘗試以下解決方案：\n1. 等待幾分鐘後重試\n2. 在設定中切換到 OpenRouter 提供商\n3. 升級您的 Google AI API 計劃");
    }
    
    // Re-throw other errors
    throw error;
  }
};

const transformWithOpenRouter = async (
  userImageBase64: string,
  patternBase64: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "AI 古裝青花瓷換裝秀"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Task: Image modification using a pattern to create traditional Chinese ink painting style with 30% top space.
Instructions:
1. You are given two images. The first image contains a person. The second image contains a texture or pattern.
2. Identify the main person in the first image.
3. Convert the ENTIRE person (including face, hair, hands, and all visible body parts) to traditional Chinese ink painting style (水墨画风格, 中國国风繪畫風格).
4. Replace their clothing with an elegant ancient Chinese costume (古裝) in traditional Chinese ink painting style (水墨画风格, 中國国风繪畫風格).
5. The new costume's texture, pattern, and color scheme MUST be derived from the second image provided.
6. Ensure that ALL aspects of the person (facial features, hair, skin texture, hands, etc.) are rendered in the traditional Chinese ink painting artistic style.
7. CRITICAL: MAINTAIN NATURAL COLOR PALETTE - DO NOT convert the image to black and white or grayscale. Preserve the original color tones while applying the ink painting style.
8. Preserve the original pose of the person but enhance all visual elements to match the ink painting aesthetic.
9. Set the entire background to a solid, pure green color for chroma keying.
10. CRITICAL: Leave exactly 30% space at the top of the image with NO content - completely empty space. This is for adding text or other elements later.
11. CRITICAL RULE: DO NOT add any extra objects, elements, or graphics from the second image into the final output. Only use it as a source for the clothing pattern. The output must only contain the modified person against the green background.
Output: Your response must contain ONLY the modified image in traditional Chinese ink painting style with exactly 30% empty space at the top. Do not include any text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: userImageBase64
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: patternBase64
                }
              }
            ]
          }
        ],
        response_format: { type: "b64_json" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Check if this is a quota exceeded error
      if (response.status === 429 || (errorText && errorText.includes("quota"))) {
        throw new Error("您的 OpenRouter API 配額已用完或請求過於頻繁。請稍後重試或在 OpenRouter 官網檢查您的配額狀態。");
      }
      
      throw new Error(`OpenRouter API 錯誤 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const message = data.choices[0].message;
      
      // Check if the response contains an image
      if (message.content) {
        // Try to extract image from content
        const imageMatch = message.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (imageMatch) {
          return imageMatch[0];
        }
      }
      
      // If we have tool calls or function calls, check those
      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.function && toolCall.function.arguments) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              if (args.image) {
                return args.image;
              }
            } catch (e) {
              // Continue to next tool call
            }
          }
        }
      }
      
      // If we have a b64_json response
      if (data.choices[0].message?.content?.b64_json) {
        return `data:image/png;base64,${data.choices[0].message.content.b64_json}`;
      }
    }

    const errorMessage = data.error 
      ? `OpenRouter API 錯誤: ${JSON.stringify(data.error)}`
      : "OpenRouter API 未返回圖片且未提供文字說明。請求可能被阻止。";
    throw new Error(errorMessage);
  } catch (error: any) {
    throw new Error(`OpenRouter 處理失敗: ${error.message}`);
  }
};