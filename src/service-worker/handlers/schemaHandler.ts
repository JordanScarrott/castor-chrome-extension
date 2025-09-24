import { geminiNanoService } from '../geminiNano/geminiNanoService';

export async function handleGenerateMangleSchema(payload: { userGoal: string }) {
  try {
    const schema = await geminiNanoService.generateMangleSchema(payload.userGoal);
    return { schema };
  } catch (error) {
    console.error('Error generating Mangle schema:', error);
    return { error: 'Failed to generate Mangle schema' };
  }
}