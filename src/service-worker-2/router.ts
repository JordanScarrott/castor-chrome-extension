import { Message, MessageType } from "../types";
import { handleProcessNewContent } from "./handlers/contentHandler";
import { handleExecuteQuery } from "./handlers/queryHandler";
import { handleGetFactStore } from "./handlers/stateHandler";
import { handleGenerateMangleSchema } from "./handlers/schemaHandler";
import { handleHotelDataExtraction } from "@/service-worker-2/handlers/hotelDataHandler";
import { handleProcessQuestion } from "./handlers/questionHandler";
import { handleElementSelection } from "./handlers/elementSelectionHandler";

// The router maps message types to their handler functions
const handlers = {
    GENERATE_MANGLE_SCHEMA: handleGenerateMangleSchema,
    PROCESS_NEW_CONTENT: handleProcessNewContent,
    EXECUTE_MANGLE_QUERY: handleExecuteQuery,
    GET_FACT_STORE_STATE: handleGetFactStore,
    PROCESS_QUESTION: handleProcessQuestion,
    ELEMENT_TEXT_SELECTED: handleElementSelection,
    HOTEL_DATA_EXTRACTED: handleHotelDataExtraction,
};

export function routeMessage(
    message: Message<MessageType>,
    sender: chrome.runtime.MessageSender
) {
    const handler = handlers[message.type];
    if (handler) {
        // If the message is HOTEL_DATA_EXTRACTED, inject the tabGroupId into the payload.
        if (
            message.type === "HOTEL_DATA_EXTRACTED" &&
            sender.tab &&
            sender.tab.groupId
        ) {
            const payloadWithTabGroupId = {
                ...message.payload,
                tabGroupId: sender.tab.groupId,
            };
            return (handler as any)(payloadWithTabGroupId);
        }

        return (handler as any)(message.payload);
    } else {
        return Promise.reject(
            new Error(`No handler found for type: ${message.type}`)
        );
    }
}
