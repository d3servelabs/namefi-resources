import openAi from 'openai';
import { secrets } from '#lib/env';

export const openai = new openAi({
  apiKey: secrets.OPENAI_API_KEY,
});
