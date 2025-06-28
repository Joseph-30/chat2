const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private static instance: GeminiService;

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async generateStoryContent(prompt: string, context: any): Promise<string> {
    try {
      const fullPrompt = `
        You are writing for an interactive horror/romance story game set in a near-future town with supernatural phenomena.
        The player is discovering their alternate timeline self is missing.
        
        Context: ${JSON.stringify(context)}
        
        Prompt: ${prompt}
        
        Rules:
        - Keep responses under 150 characters for mobile chat format
        - Maintain story consistency 
        - Include subtle horror elements when appropriate
        - Build romantic tension gradually
        - Reference previous choices and relationship levels
        - End with natural conversation flow for player choices
      `;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }]
        })
      });

      const data: GeminiResponse = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Something went wrong...';
    } catch (error) {
      console.error('Gemini API error:', error);
      return 'Connection lost... try again later.';
    }
  }

  async generateChoices(context: any, characterId: string): Promise<any[]> {
    try {
      const prompt = `
        Generate 3-4 realistic chat response choices for this context:
        Character: ${characterId}
        Context: ${JSON.stringify(context)}
        
        Return as JSON array with format:
        [{
          "text": "choice text (max 50 chars)",
          "consequence": "brief outcome description",
          "relationshipEffect": {"${characterId}": number between -5 and 5}
        }]
        
        Make choices distinct with different relationship impacts.
      `;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data: GeminiResponse = await response.json();
      const choicesText = data.candidates?.[0]?.content.parts[0]?.text || '[]';
      
      try {
        return JSON.parse(choicesText);
      } catch {
        // Fallback choices if JSON parsing fails
        return [
          { text: "That's interesting...", consequence: "neutral", relationshipEffect: { [characterId]: 0 } },
          { text: "Tell me more", consequence: "positive", relationshipEffect: { [characterId]: 2 } },
          { text: "I'm not sure about this", consequence: "cautious", relationshipEffect: { [characterId]: -1 } }
        ];
      }
    } catch (error) {
      console.error('Choice generation error:', error);
      return [
        { text: "...", consequence: "neutral", relationshipEffect: { [characterId]: 0 } }
      ];
    }
  }

  async generateImage(prompt: string): Promise<string | null> {
    // Note: Gemini doesn't directly generate images, but we can return a placeholder
    // In a real implementation, you'd use a service like DALL-E or Midjourney
    // For now, we'll return a relevant Pexels URL based on the prompt
    
    const imagePrompts: { [key: string]: string } = {
      'glitch': 'https://images.pexels.com/photos/1054289/pexels-photo-1054289.jpeg',
      'supernatural': 'https://images.pexels.com/photos/1314544/pexels-photo-1314544.jpeg',
      'town': 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg',
      'mystery': 'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg',
      'horror': 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg',
      'future': 'https://images.pexels.com/photos/3913025/pexels-photo-3913025.jpeg'
    };

    for (const [key, url] of Object.entries(imagePrompts)) {
      if (prompt.toLowerCase().includes(key)) {
        return url;
      }
    }

    return 'https://images.pexels.com/photos/1314544/pexels-photo-1314544.jpeg';
  }
}