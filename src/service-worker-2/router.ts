import { Message, MessageType } from "../types";
import { handleProcessNewContent } from "./handlers/contentHandler";
import { handleExecuteQuery } from "./handlers/queryHandler";
import { handleGetFactStore } from "./handlers/stateHandler";
import { handleGenerateMangleSchema } from "./handlers/schemaHandler";
import { handleHotelDataExtraction } from "@/service-worker-2/handlers/hotelDataHandler";
import { handleProcessQuestion } from "./handlers/questionHandler";
import { handleElementSelection } from "./handlers/elementSelectionHandler";
import { handleTranslateQueries } from "./handlers/queryTranslationHandler";

// The router maps message types to their handler functions
const handlers = {
    GENERATE_MANGLE_SCHEMA: handleGenerateMangleSchema,
    PROCESS_NEW_CONTENT: handleProcessNewContent,
    EXECUTE_MANGLE_QUERY: handleExecuteQuery,
    GET_FACT_STORE_STATE: handleGetFactStore,
    PROCESS_QUESTION: handleProcessQuestion,
    ELEMENT_TEXT_SELECTED: handleElementSelection,
    HOTEL_DATA_EXTRACTED: handleHotelDataExtraction,
    TRANSLATE_QUERIES: handleTranslateQueries,
    // EXECUTE_MANGLE_QUERY: handleExecuteQuery,
};

export function routeMessage(
    message: Message<MessageType>,
    sender: chrome.runtime.MessageSender
) {
    const handler = handlers[message.type];
    if (!handler) {
        return Promise.reject(new Error(`No handler found for type: ${message.type}`));
    }

    // Prioritize tabGroupId from payload if it exists
    if (message.payload && typeof message.payload === 'object' && 'tabGroupId' in message.payload) {
        return (handler as any)(message.payload, message.payload.tabGroupId);
    }

    // Fallback to sender's tab groupId for handlers that need it
    if (sender.tab && sender.tab.groupId) {
        return (handler as any)(message.payload, sender.tab.groupId);
    }

    // Call handler without tabGroupId
    return (handler as any)(message.payload);
}
