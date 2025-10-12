import { Message, MessageType } from "../types";
import { handleProcessNewContent } from "./handlers/contentHandler";
import { handleExecuteQuery } from "./handlers/queryHandler";
import { handleGetFactStore } from "./handlers/stateHandler";
import { handleGenerateMangleSchema } from "./handlers/schemaHandler";
import { handleHotelDataExtraction } from "@/service-worker-2/handlers/hotelDataHandler";

// The router maps message types to their handler functions
const handlers = {
    GENERATE_MANGLE_SCHEMA: handleGenerateMangleSchema,
    PROCESS_NEW_CONTENT: handleProcessNewContent,
    EXECUTE_MANGLE_QUERY: handleExecuteQuery,
    GET_FACT_STORE_STATE: handleGetFactStore,

    HOTEL_DATA_EXTRACTED: handleHotelDataExtraction,
};

export function routeMessage(message: Message<MessageType>) {
    const handler = handlers[message.type];
    if (handler) {
        return (handler as any)(message.payload);
    } else {
        return Promise.reject(
            new Error(`No handler found for type: ${message.type}`)
        );
    }
}
