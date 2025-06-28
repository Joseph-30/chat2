// Enhanced Image Generation Service using free APIs
export class ImageGenerationService {
  private static instance: ImageGenerationService;
  
  // Free Hugging Face models that don't require API keys
  private readonly HUGGING_FACE_MODELS = [
    'runwayml/stable-diffusion-v1-5',
    'stabilityai/stable-diffusion-2-1',
    'prompthero/openjourney-v4'
  ];

  static getInstance(): ImageGenerationService {
    if (!ImageGenerationService.instance) {
      ImageGenerationService.instance = new ImageGenerationService();
    }
    return ImageGenerationService.instance;
  }

  async generateWithHuggingFace(prompt: string): Promise<string | null> {
    try {
      // Use Hugging Face Inference API (free tier)
      const response = await fetch(
        'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: `${prompt}, high quality, detailed, digital art`,
            parameters: {
              guidance_scale: 7.5,
              num_inference_steps: 20,
            }
          })
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        // Convert blob to base64 URL for display
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      
      return null;
    } catch (error) {
      console.error('Hugging Face generation error:', error);
      return null;
    }
  }

  async generateWithPicsum(prompt: string): Promise<string> {
    // Enhanced Picsum integration with better theming
    interface ThemeConfig {
      grayscale?: boolean;
      blur?: number;
      seed: number;
    }

    const themes: { [key: string]: ThemeConfig } = {
      horror: { grayscale: true, blur: 2, seed: Math.floor(Math.random() * 100) + 400 },
      mystery: { grayscale: true, blur: 1, seed: Math.floor(Math.random() * 100) + 500 },
      supernatural: { grayscale: true, seed: Math.floor(Math.random() * 100) + 600 },
      romance: { seed: Math.floor(Math.random() * 100) + 700 },
      futuristic: { seed: Math.floor(Math.random() * 100) + 800 },
      character: { seed: Math.floor(Math.random() * 100) + 900 },
      landscape: { seed: Math.floor(Math.random() * 100) + 1000 },
      portrait: { seed: Math.floor(Math.random() * 100) + 1100 }
    };

    let selectedTheme: ThemeConfig = themes.character; // default
    let dimensions = '400/600'; // default portrait

    // Analyze prompt for theme
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('horror') || lowerPrompt.includes('scary')) {
      selectedTheme = themes.horror;
    } else if (lowerPrompt.includes('mystery') || lowerPrompt.includes('suspense')) {
      selectedTheme = themes.mystery;
    } else if (lowerPrompt.includes('supernatural') || lowerPrompt.includes('ghost')) {
      selectedTheme = themes.supernatural;
    } else if (lowerPrompt.includes('romance') || lowerPrompt.includes('love')) {
      selectedTheme = themes.romance;
    } else if (lowerPrompt.includes('future') || lowerPrompt.includes('sci-fi')) {
      selectedTheme = themes.futuristic;
    } else if (lowerPrompt.includes('landscape') || lowerPrompt.includes('scenery')) {
      selectedTheme = themes.landscape;
      dimensions = '800/400';
    }

    // Build URL with parameters
    let url = `https://picsum.photos/${dimensions}?random=${selectedTheme.seed}`;
    
    if (selectedTheme.grayscale) url += '&grayscale';
    if (selectedTheme.blur) url += `&blur=${selectedTheme.blur}`;

    return url;
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      // Try Hugging Face first (free AI generation)
      const aiImage = await this.generateWithHuggingFace(prompt);
      if (aiImage) {
        return aiImage;
      }
      
      // Fallback to enhanced Picsum
      return await this.generateWithPicsum(prompt);
      
    } catch (error) {
      console.error('Image generation error:', error);
      return this.generateWithPicsum(prompt);
    }
  }
}
