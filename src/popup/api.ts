import { ApiContract, MessageType } from '../types';

async function callApi<T extends MessageType>(
  type: T,
  payload: ApiContract[T][0]
): Promise<ApiContract[T][1]> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      if (response?.error) {
        return reject(new Error(response.error));
      }
      resolve(response);
    });
  });
}

export const serviceWorkerApi = {
  processNewContent: (content: string) => {
    return callApi('PROCESS_NEW_CONTENT', { content });
  },
  executeQuery: (query: string) => {
    return callApi('EXECUTE_MANGLE_QUERY', { query });
  },
  getFactStoreState: () => {
    return callApi('GET_FACT_STORE_STATE', undefined as any);
  }
};
