import openAi from 'openai';
import { secrets } from '#lib/env';

export const deepseek = new openAi({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: secrets.DEEPSEEK_API_KEY,
});
