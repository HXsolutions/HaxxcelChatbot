import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

interface LLMProvider {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
  requiresApiKey: boolean;
}

interface LLMResponse {
  success: boolean;
  message?: string;
  models?: string[];
  response?: string;
}

export class LLMProviders {
  private providers: LLMProvider[] = [
    {
      id: 'google',
      name: 'Google (Gemini)',
      models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemma-3-27b', 'gemma-3-12b', 'gemma-3-4b', 'gemma-3-1b'],
      defaultModel: 'gemini-2.5-pro',
      requiresApiKey: true,
    },
    {
      id: 'openai',
      name: 'OpenAI',
      models: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'o3-mini'],
      defaultModel: 'gpt-4o',
      requiresApiKey: true,
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: ['claude-sonnet-4-20250514', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022'],
      defaultModel: 'claude-sonnet-4-20250514',
      requiresApiKey: true,
    },
    {
      id: 'xai',
      name: 'xAI (Grok)',
      models: ['grok-2-vision-1212', 'grok-2-1212', 'grok-vision-beta', 'grok-beta'],
      defaultModel: 'grok-2-1212',
      requiresApiKey: true,
    },
    {
      id: 'meta',
      name: 'Meta (LLaMA)',
      models: ['llama-3.2-405b', 'llama-3.2-70b', 'llama-3.1-70b', 'llama-3-70b'],
      defaultModel: 'llama-3.2-70b',
      requiresApiKey: true,
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      models: ['mistral-large-instruct-2407', 'codestral-22b', 'mistral-small-3.1'],
      defaultModel: 'mistral-large-instruct-2407',
      requiresApiKey: true,
    },
    {
      id: 'alibaba',
      name: 'Alibaba (Qwen)',
      models: ['qwen-3-235b', 'qwen-3-32b', 'qwen-3-4b', 'qwen-2.5-coder-32b'],
      defaultModel: 'qwen-3-32b',
      requiresApiKey: true,
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      models: ['deepseek-r1', 'deepseek-r1-distill-llama-70b'],
      defaultModel: 'deepseek-r1',
      requiresApiKey: true,
    },
  ];

  getAvailableProviders(): LLMProvider[] {
    return this.providers;
  }

  async testConnection(providerId: string, apiKey: string, model?: string): Promise<LLMResponse> {
    try {
      switch (providerId) {
        case 'google':
          return await this.testGoogle(apiKey, model);
        case 'openai':
          return await this.testOpenAI(apiKey, model);
        case 'anthropic':
          return await this.testAnthropic(apiKey, model);
        case 'xai':
          return await this.testXAI(apiKey, model);
        default:
          return { success: false, message: `Provider ${providerId} not supported for testing yet` };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getModels(providerId: string, apiKey: string): Promise<string[]> {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // For now, return the static list. In production, you'd fetch from API
    return provider.models;
  }

  async generateResponse(providerId: string, model: string, message: string, systemPrompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('No API key configured for LLM providers');
    }

    return await this.generateResponseWithApiKey(providerId, model, message, systemPrompt, apiKey);
  }

  async generateResponseWithApiKey(providerId: string, model: string, message: string, systemPrompt: string, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error('API key is required for response generation');
    }

    switch (providerId) {
      case 'google':
        return await this.generateGoogleResponse(apiKey, model, message, systemPrompt);
      case 'openai':
        return await this.generateOpenAIResponse(apiKey, model, message, systemPrompt);
      case 'anthropic':
        return await this.generateAnthropicResponse(apiKey, model, message, systemPrompt);
      default:
        throw new Error(`Response generation not implemented for ${providerId}`);
    }
  }

  private async testGoogle(apiKey: string, model?: string): Promise<LLMResponse> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: model || 'gemini-2.5-pro',
        contents: 'Hello, this is a test message.',
      });

      return {
        success: true,
        message: 'Google AI connection successful',
        response: response.text || 'Test successful',
      };
    } catch (error: any) {
      return { success: false, message: `Google AI test failed: ${error.message}` };
    }
  }

  private async testOpenAI(apiKey: string, model?: string): Promise<LLMResponse> {
    try {
      const openai = new OpenAI({ apiKey });
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: model || 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        max_tokens: 50,
      });

      return {
        success: true,
        message: 'OpenAI connection successful',
        response: response.choices[0]?.message?.content || 'Test successful',
      };
    } catch (error: any) {
      return { success: false, message: `OpenAI test failed: ${error.message}` };
    }
  }

  private async testAnthropic(apiKey: string, model?: string): Promise<LLMResponse> {
    try {
      const anthropic = new Anthropic({ apiKey });
      // The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229".
      const response = await anthropic.messages.create({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
      });

      return {
        success: true,
        message: 'Anthropic connection successful',
        response: response.content[0]?.type === 'text' ? response.content[0].text : 'Test successful',
      };
    } catch (error: any) {
      return { success: false, message: `Anthropic test failed: ${error.message}` };
    }
  }

  private async testXAI(apiKey: string, model?: string): Promise<LLMResponse> {
    try {
      const openai = new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey });
      const response = await openai.chat.completions.create({
        model: model || 'grok-2-1212',
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        max_tokens: 50,
      });

      return {
        success: true,
        message: 'xAI connection successful',
        response: response.choices[0]?.message?.content || 'Test successful',
      };
    } catch (error: any) {
      return { success: false, message: `xAI test failed: ${error.message}` };
    }
  }

  private async generateGoogleResponse(apiKey: string, model: string, message: string, systemPrompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction: systemPrompt,
      },
      contents: message,
    });

    return response.text || 'No response generated';
  }

  private async generateOpenAIResponse(apiKey: string, model: string, message: string, systemPrompt: string): Promise<string> {
    const openai = new OpenAI({ apiKey });
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
    });

    return response.choices[0]?.message?.content || 'No response generated';
  }

  private async generateAnthropicResponse(apiKey: string, model: string, message: string, systemPrompt: string): Promise<string> {
    const anthropic = new Anthropic({ apiKey });
    // The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229".
    const response = await anthropic.messages.create({
      model,
      system: systemPrompt,
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
    });

    return response.content[0]?.type === 'text' ? response.content[0].text : 'No response generated';
  }
}

export const llmProviders = new LLMProviders();
