import { QandA } from "@/service-worker-2/handlers/hotelDataHandler";
import { MangleSchema } from "./types/MangleSchema";

// A mapping of all possible message types to their payload and response types
export interface ApiContract {
    // Key: Message Type, Value: [Payload, Response]
    GENERATE_MANGLE_SCHEMA: [{ userGoal: string }, { schema: MangleSchema }];
    PROCESS_NEW_CONTENT: [
        { content: string; schema: MangleSchema }, // Payload
        { status: "QUEUED" | "ERROR"; message?: string } // Response
    ];
    EXECUTE_MANGLE_QUERY: [
        { query: string },
        { result: string | null; error?: string }
    ];
    GET_FACT_STORE_STATE: [
        undefined, // No payload for this request
        { factStore: Record<string, any> }
    ];
    PROCESS_QUESTION: [string, { response: string }];
    HOTEL_DATA_EXTRACTED: [
        { hotelData: HotelInfo[]; tabGroupId: number },
        { result: QandA[] }
    ];
    ELEMENT_TEXT_SELECTED: [string, void];
}

// Generic types to make working with the contract easier
export type MessageType = keyof ApiContract;

export interface Message<T extends MessageType> {
    type: T;
    payload: ApiContract[T][0];
}

export type ApiResponse<T extends MessageType> = ApiContract[T][1];
