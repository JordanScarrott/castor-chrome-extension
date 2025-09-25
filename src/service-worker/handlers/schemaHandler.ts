import { geminiNanoService } from '../geminiNano/geminiNanoService';
import { storageAdapter } from '../storage/storage';

export async function handleGenerateMangleSchema(payload: { userGoal: string }) {
  try {
    const schema = await geminiNanoService.generateMangleSchema(payload.userGoal);
    await storageAdapter.set('mangleSchema', schema);
    return { schema };
  } catch (error) {
    console.error('Error generating Mangle schema:', error);
    return { error: 'Failed to generate Mangle schema' };
  }
}