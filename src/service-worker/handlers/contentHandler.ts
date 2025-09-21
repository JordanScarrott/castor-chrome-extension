import { ApiContract } from '../../types';

// Placeholder for your actual processing logic
async function processContent(content: string): Promise<void> {
  console.log(`Queueing content for processing: ${content.substring(0, 50)}...`);
  // In the real implementation, this would interact with a queue in chrome.storage
}

export async function handleProcessNewContent(
  payload: ApiContract['PROCESS_NEW_CONTENT'][0]
): Promise<ApiContract['PROCESS_NEW_CONTENT'][1]> {
  try {
    await processContent(payload.content);
    return { status: 'QUEUED' };
  } catch (error) {
    return { status: 'ERROR', message: (error as Error).message };
  }
}
