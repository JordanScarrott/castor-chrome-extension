// A mapping of all possible message types to their payload and response types
export interface ApiContract {
  // Key: Message Type, Value: [Payload, Response]
  'PROCESS_NEW_CONTENT': [
    { content: string }, // Payload
    { status: 'QUEUED' | 'ERROR', message?: string } // Response
  ];
  'EXECUTE_MANGLE_QUERY': [
    { query: string },
    { result: string | null, error?: string }
  ];
  'GET_FACT_STORE_STATE': [
    undefined, // No payload for this request
    { factStore: Record<string, any> }
  ];
}

// Generic types to make working with the contract easier
export type MessageType = keyof ApiContract;

export interface Message<T extends MessageType> {
  type: T;
  payload: ApiContract[T][0];
}

export type ApiResponse<T extends MessageType> = ApiContract[T][1];
