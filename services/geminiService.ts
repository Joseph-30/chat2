import { ImageGenerationService } from './imageGenerationService';
import { StoryService } from './storyService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_VISION_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-vision-latest:generateContent';

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
      // Check if API key is available
      if (!GEMINI_API_KEY) {
        console.log('Gemini API key not available, using fallback content');
        return this.getFallbackContent(context);
      }

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
        - Return ONLY the story text, no markdown or code blocks
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

      if (!response.ok) {
        console.log('Gemini API HTTP error:', response.status, response.statusText);
        return this.getFallbackContent(context);
      }

      const data: GeminiResponse = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        console.log('No response text from Gemini, using fallback');
        return this.getFallbackContent(context);
      }
      
      // Clean the response text
      let cleanText = responseText.trim();
      
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```[^```]*```/g, '');
      cleanText = cleanText.replace(/```/g, '');
      
      // Remove any leading/trailing quotes
      cleanText = cleanText.replace(/^["']|["']$/g, '');
      
      // Ensure it's not empty after cleaning
      if (!cleanText || cleanText.length < 5) {
        return this.getFallbackContent(context);
      }
      
      return cleanText;
      
    } catch (error) {
      console.log('Gemini API error, using fallback:', error.message);
      return this.getFallbackContent(context);
    }
  }

  private getFallbackContent(context: any): string {
    const character = context.character;
    const playerName = context.playerName || 'Player';
    
    if (character?.id === 'alex') {
      return `Hey ${playerName}! Something strange is happening in town. I think you need to see this...`;
    } else if (character?.id === 'maya') {
      return `The temporal readings are off the charts. We need to talk about what's happening.`;
    } else if (character?.id === 'unknown') {
      return `You don't know me, but I know about your missing alternate self...`;
    }
    
    return `Something mysterious is happening. We need to investigate this together.`;
  }

  async generateChoices(context: any, characterId: string): Promise<any[]> {
    try {
      // Check if API key is available
      if (!GEMINI_API_KEY) {
        console.log('Gemini API key not available, using fallback choices');
        return this.getFallbackChoices(context, characterId);
      }

      const prompt = `
        Generate 3-4 smart, contextual chat response choices for this interactive horror/romance story:
        
        Character: ${context.character?.name || characterId}
        Player: ${context.playerName || 'Player'}
        Relationship Level: ${context.relationshipLevel || 0} (${context.relationshipTier || 'neutral'})
        Story Stage: ${context.storyProgression || 'developing'}
        Chapter: ${context.chapter || 1}
        Messages Exchanged: ${context.totalMessages || 0}
        
        Last AI Response: "${context.lastAIResponse || 'No previous response'}"
        
        Conversation History: ${JSON.stringify(context.conversationHistory || [])}
        
        Requirements:
        - Each choice should be under 50 characters
        - Choices should reflect different personality approaches (bold, cautious, flirty, investigative)
        - Consider the story progression and relationship level
        - Make consequences meaningful and story-advancing
        - Include relationship effects between -3 and +3
        - Ensure choices don't repeat previous patterns
        
        Return as JSON array with format:
        [{
          "text": "choice text (max 50 chars)",
          "consequence": "specific story outcome description",
          "relationshipEffect": {"${characterId}": number between -3 and 3}
        }]
        
        Make each choice distinct and story-relevant.
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
        // Clean the response text - remove markdown code blocks
        let cleanChoicesText = choicesText.trim();
        cleanChoicesText = cleanChoicesText.replace(/```json\s*/g, '');
        cleanChoicesText = cleanChoicesText.replace(/```\s*/g, '');
        
        // Extract JSON from response
        const jsonMatch = cleanChoicesText.match(/\[[\s\S]*\]/);
        const jsonText = jsonMatch ? jsonMatch[0] : cleanChoicesText;
        
        const choices = JSON.parse(jsonText);
        
        // Validate and return choices
        if (Array.isArray(choices) && choices.length > 0) {
          return choices.map((choice, index) => ({
            text: choice.text || "Continue...",
            consequence: choice.consequence || "neutral response",
            relationshipEffect: choice.relationshipEffect || { [characterId]: 0 },
          }));
        }
      } catch (parseError) {
        console.log('Failed to parse choices JSON, using fallback');
      }
      
      // Enhanced fallback choices based on context
      const storyStage = context.storyProgression || 'developing';
      
      if (storyStage === 'beginning') {
        return [
          { text: "Tell me more about this", consequence: "shows interest in character's story", relationshipEffect: { [characterId]: 1 } },
          { text: "That sounds suspicious...", consequence: "character becomes more defensive", relationshipEffect: { [characterId]: -1 } },
          { text: "I'm here to help", consequence: "builds trust with character", relationshipEffect: { [characterId]: 2 } },
          { text: "Why should I trust you?", consequence: "challenges character's motives", relationshipEffect: { [characterId]: 0 } }
        ];
      } else if (storyStage === 'developing') {
        return [
          { text: "What aren't you telling me?", consequence: "pushes for deeper truth", relationshipEffect: { [characterId]: 0 } },
          { text: "I believe you", consequence: "strengthens bond", relationshipEffect: { [characterId]: 2 } },
          { text: "This is getting dangerous", consequence: "shows concern", relationshipEffect: { [characterId]: 1 } },
          { text: "Let's investigate together", consequence: "commits to shared adventure", relationshipEffect: { [characterId]: 2 } }
        ];
      } else if (storyStage === 'climax') {
        return [
          { text: "We need to stop this now!", consequence: "takes decisive action", relationshipEffect: { [characterId]: 1 } },
          { text: "I won't let anything happen to you", consequence: "protective declaration", relationshipEffect: { [characterId]: 3 } },
          { text: "Maybe we should run...", consequence: "suggests retreat", relationshipEffect: { [characterId]: -1 } },
          { text: "Trust me, I have a plan", consequence: "leads with confidence", relationshipEffect: { [characterId]: 2 } }
        ];
      } else {
        return [
          { text: "What happens now?", consequence: "seeks closure", relationshipEffect: { [characterId]: 0 } },
          { text: "I'm glad we're safe", consequence: "expresses relief", relationshipEffect: { [characterId]: 1 } },
          { text: "This isn't over, is it?", consequence: "hints at continuation", relationshipEffect: { [characterId]: 0 } },
          { text: "Thank you for everything", consequence: "shows gratitude", relationshipEffect: { [characterId]: 2 } }
        ];
      }
    } catch (error) {
      console.log('Choice generation error, using fallback:', error.message);
      return this.getFallbackChoices(context, characterId);
    }
  }

  private getFallbackChoices(context: any, characterId: string): any[] {
    const storyStage = context.storyProgression || 'developing';
    
    if (storyStage === 'beginning') {
      return [
        { text: "Tell me more about this", consequence: "shows interest in character's story", relationshipEffect: { [characterId]: 1 } },
        { text: "That sounds suspicious...", consequence: "character becomes more defensive", relationshipEffect: { [characterId]: -1 } },
        { text: "I'm here to help", consequence: "builds trust with character", relationshipEffect: { [characterId]: 2 } },
        { text: "Why should I trust you?", consequence: "challenges character's motives", relationshipEffect: { [characterId]: 0 } }
      ];
    } else if (storyStage === 'developing') {
      return [
        { text: "What aren't you telling me?", consequence: "pushes for deeper truth", relationshipEffect: { [characterId]: 0 } },
        { text: "I believe you", consequence: "strengthens bond", relationshipEffect: { [characterId]: 2 } },
        { text: "This is getting dangerous", consequence: "shows concern", relationshipEffect: { [characterId]: 1 } },
        { text: "Let's investigate together", consequence: "commits to shared adventure", relationshipEffect: { [characterId]: 2 } }
      ];
    } else if (storyStage === 'climax') {
      return [
        { text: "We need to stop this now!", consequence: "takes decisive action", relationshipEffect: { [characterId]: 1 } },
        { text: "I won't let anything happen to you", consequence: "protective declaration", relationshipEffect: { [characterId]: 3 } },
        { text: "Maybe we should run...", consequence: "suggests retreat", relationshipEffect: { [characterId]: -1 } },
        { text: "Trust me, I have a plan", consequence: "leads with confidence", relationshipEffect: { [characterId]: 2 } }
      ];
    } else {
      return [
        { text: "What happens now?", consequence: "seeks closure", relationshipEffect: { [characterId]: 0 } },
        { text: "I'm glad we're safe", consequence: "expresses relief", relationshipEffect: { [characterId]: 1 } },
        { text: "This isn't over, is it?", consequence: "hints at continuation", relationshipEffect: { [characterId]: 0 } },
        { text: "Thank you for everything", consequence: "shows gratitude", relationshipEffect: { [characterId]: 2 } }
      ];
    }
  }

  async generateImage(prompt: string): Promise<string | null> {
    try {
      const imageService = ImageGenerationService.getInstance();
      return await imageService.generateImage(prompt);
    } catch (error) {
      console.error('Image generation error:', error);
      return 'https://picsum.photos/800/600?random=1';
    }
  }
}