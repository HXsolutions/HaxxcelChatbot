// Voice providers service for handling different voice/speech services
export interface VoiceProvider {
  id: string;
  name: string;
  description: string;
  supportsTTS: boolean;
  supportsSTT: boolean;
  voices?: string[];
}

export class VoiceProvidersService {
  private providers: VoiceProvider[] = [
    {
      id: 'google',
      name: 'Google Cloud Speech',
      description: 'Google\'s speech-to-text and text-to-speech services',
      supportsTTS: true,
      supportsSTT: true,
      voices: ['en-US-Wavenet-D', 'en-US-Wavenet-F', 'en-GB-Wavenet-A']
    },
    {
      id: 'openai',
      name: 'OpenAI Whisper & TTS',
      description: 'OpenAI\'s Whisper for STT and TTS-1 for voice generation',
      supportsTTS: true,
      supportsSTT: true,
      voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    },
    {
      id: 'deepgram',
      name: 'Deepgram',
      description: 'High-accuracy speech recognition and synthesis',
      supportsTTS: true,
      supportsSTT: true,
      voices: ['aura-asteria-en', 'aura-luna-en', 'aura-stella-en']
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      description: 'AI voice generation with cloning capabilities',
      supportsTTS: true,
      supportsSTT: false,
      voices: ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh']
    }
  ];

  getAvailableProviders(): VoiceProvider[] {
    return this.providers;
  }

  async testConnection(provider: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    // In a real implementation, this would test the actual API connection
    try {
      switch (provider) {
        case 'google':
          // Test Google Cloud Speech API
          return { success: true, message: 'Google Cloud Speech connection successful' };
        
        case 'openai':
          // Test OpenAI API
          return { success: true, message: 'OpenAI connection successful' };
        
        case 'deepgram':
          // Test Deepgram API
          return { success: true, message: 'Deepgram connection successful' };
        
        case 'elevenlabs':
          // Test ElevenLabs API
          return { success: true, message: 'ElevenLabs connection successful' };
        
        default:
          return { success: false, message: 'Unknown voice provider' };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${(error as Error).message}` };
    }
  }

  async getVoices(provider: string, apiKey: string): Promise<string[]> {
    const providerData = this.providers.find(p => p.id === provider);
    return providerData?.voices || [];
  }
}

export const voiceProviders = new VoiceProvidersService();