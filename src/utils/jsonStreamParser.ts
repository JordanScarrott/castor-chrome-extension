// src/utils/jsonStreamParser.ts

/**
 * Creates a simple streaming parser to extract the value of a specific string key from a JSON object stream.
 * This is not a full JSON parser, but a targeted utility for this specific use case.
 * It's designed to be robust against chunks splitting the key or value.
 *
 * @param key The string key to look for (e.g., "extracted_text").
 * @param onValueChunk A callback that will be invoked with each chunk of the key's value.
 * @returns A function that processes incoming raw string chunks from the stream.
 */
export function createStreamingJsonExtractor(
    key: string,
    onValueChunk: (valueChunk: string) => void
) {
    let buffer = "";
    let isExtracting = false;
    const searchKey = `"${key}":"`;

    return function processChunk(chunk: string) {
        buffer += chunk;

        while (buffer.length > 0) {
            if (!isExtracting) {
                const keyIndex = buffer.indexOf(searchKey);
                if (keyIndex !== -1) {
                    // Found the key. The value starts right after it.
                    buffer = buffer.substring(keyIndex + searchKey.length);
                    isExtracting = true;
                } else {
                    // The key hasn't been found in the buffer yet.
                    // Keep a small part of the buffer to handle cases where the key is split across chunks.
                    if (buffer.length > searchKey.length) {
                        buffer = buffer.substring(buffer.length - searchKey.length);
                    }
                    // Not enough data to find the key, wait for the next chunk.
                    return;
                }
            }

            if (isExtracting) {
                let i = 0;
                while (i < buffer.length) {
                    const char = buffer[i];
                    // Check for an unescaped closing quote which marks the end of the string value.
                    if (char === '"' && (i === 0 || buffer[i - 1] !== '\\')) {
                        // End of the value.
                        isExtracting = false;
                        // Pass the final part of the value to the callback.
                        onValueChunk(buffer.substring(0, i));
                        // The rest of the buffer is processed in the next loop iteration.
                        buffer = buffer.substring(i + 1);
                        break; // Exit the inner while loop
                    }
                    i++;
                }

                if (i === buffer.length) {
                    // We've reached the end of the buffer without finding the end of the value.
                    // Pass the entire buffer to the callback and clear it.
                    onValueChunk(buffer);
                    buffer = "";
                }
            }
        }
    };
}
