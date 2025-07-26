import { ImageGenerationService } from './imageGenerationService';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek/deepseek-chat-v3-0324:free';

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateStoryContent(prompt: string, context: any): Promise<string> {
    try {
      // Check if API key is available
      if (!OPENROUTER_API_KEY) {
        console.error('OpenRouter API key is not configured');
        return 'Configuration error... check your API key.';
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

      console.log('Making OpenRouter API call...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 10000); // 10 second timeout
      });
      
      // Create the API request promise
      const apiPromise = fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chat2.app', // Optional site URL
          'X-Title': 'Interactive Story Chat', // Optional site title
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        })
      });

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API HTTP error:', response.status, response.statusText, errorText);
        return 'Connection lost... try again later.';
      }

      const data: OpenRouterResponse = await response.json();
      console.log('OpenRouter API response received');
      
      const responseText = data.choices?.[0]?.message?.content;
      
      if (!responseText) {
        console.error('No response text from OpenRouter:', data);
        return 'Something mysterious happened...';
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
        return 'The signal fades... strange...';
      }
      
      console.log('Generated story content successfully');
      return cleanText;
      
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return 'Connection lost... try again later.';
    }
  }

  async generateChoices(context: any, characterId: string): Promise<any[]> {
    try {
      // Check if API key is available
      if (!OPENROUTER_API_KEY) {
        console.error('OpenRouter API key is not configured');
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

      console.log('Generating choices for character:', characterId);

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chat2.app', // Optional site URL
          'X-Title': 'Interactive Story Chat', // Optional site title
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('OpenRouter API HTTP error for choices:', response.status, response.statusText);
        return this.getFallbackChoices(context, characterId);
      }

      const data: OpenRouterResponse = await response.json();
      const choicesText = data.choices?.[0]?.message?.content || '[]';
      
      console.log('Raw choices response:', choicesText);
      
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
          console.log('Generated choices:', choices);
          return choices.map(choice => ({
            text: choice.text || "Continue...",
            consequence: choice.consequence || "neutral response",
            relationshipEffect: choice.relationshipEffect || { [characterId]: 0 }
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse choices JSON:', parseError);
        console.error('Raw response:', choicesText);
      }
      
      // Fallback to context-based choices
      return this.getFallbackChoices(context, characterId);
      
    } catch (error) {
      console.error('Choice generation error:', error);
      return this.getFallbackChoices(context, characterId);
    }
  }

  private getFallbackChoices(context: any, characterId: string): any[] {
    const relationshipLevel = context.relationshipLevel || 0;
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