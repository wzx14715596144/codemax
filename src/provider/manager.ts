import type { Config } from '../config';
import type { AIProvider } from './interface';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { OpenRouterProvider } from './openrouter';
import { OllamaProvider } from './ollama';
import { AzureProvider } from './azure';
import { logger } from '../utils';

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private currentModel: string;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.currentModel = config.model || 'openai/gpt-4o';
  }

  initializeProviders() {
    const cfg = this.config.providers || {};

    if (cfg.openai) {
      this.providers.set('openai', new OpenAIProvider(cfg.openai));
    }
    if (cfg.anthropic) {
      this.providers.set('anthropic', new AnthropicProvider(cfg.anthropic));
    }
    if (cfg.google) {
      this.providers.set('google', new GoogleProvider(cfg.google));
    }
    if (cfg.openrouter) {
      this.providers.set('openrouter', new OpenRouterProvider(cfg.openrouter));
    }
    if (cfg.ollama) {
      this.providers.set('ollama', new OllamaProvider(cfg.ollama));
    }
    if (cfg.azure) {
      this.providers.set('azure', new AzureProvider(cfg.azure));
    }

    if (this.providers.size === 0) {
      logger.warn('No AI providers configured. Set API keys in codemax.json or environment variables.');
    } else {
      logger.success(`Loaded ${this.providers.size} provider(s)`);
    }
  }

  getCurrentProvider(): AIProvider | undefined {
    const providerName = this.currentModel.split('/')[0];
    return this.providers.get(providerName);
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  setCurrentModel(model: string) {
    this.currentModel = model;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
