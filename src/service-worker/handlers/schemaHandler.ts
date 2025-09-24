import { geminiNanoService } from '../geminiNano/geminiNanoService';
import { sessionManager } from '../core/SessionManager';

export async function handleGenerateMangleSchema(payload: { userGoal: string }) {
  try {
    const schema = await geminiNanoService.generateMangleSchema(payload.userGoal);
    sessionManager.setGoal(payload.userGoal);
    sessionManager.setMangleSchema(schema);
    return { schema };
  } catch (error) {
    console.error('Error generating Mangle schema:', error);
    return { error: 'Failed to generate Mangle schema' };
  }
}