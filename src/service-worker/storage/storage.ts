/**
 * @interface StorageAdapter
 * @description Defines a common interface for storage mechanisms.
 */
interface StorageAdapter {
    /**
     * Saves a value with a specific key.
     * @param {string} key - The key under which to store the value.
     * @param {any} value - The value to store.
     * @returns {Promise<void>} A promise that resolves when the save is complete.
     */
    save(key: string, value: any): Promise<void>;

    /**
     * Reads a value by its key.
     * @template T - The expected type of the returned value.
     * @param {string} key - The key of the value to retrieve.
     * @returns {Promise<T | null>} A promise that resolves with the value, or null if not found.
     */
    read<T>(key: string): Promise<T | null>;

    /**
     * Deletes a value by its key.
     * @param {string} key - The key of the value to delete.
     * @returns {Promise<void>} A promise that resolves when the deletion is complete.
     */
    delete(key: string): Promise<void>;
}

/**
 * @class LocalStorageAdapter
 * @implements {StorageAdapter}
 * @description An adapter for the browser's localStorage.
 * Note: Stores data as JSON strings.
 */
class LocalStorageAdapter implements StorageAdapter {
    constructor() {
        console.log("LocalStorageAdapter initialized.");
    }

    public async save(key: string, value: any): Promise<void> {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return Promise.resolve();
        } catch (error) {
            console.error("Error saving to localStorage:", error);
            return Promise.reject(error);
        }
    }

    public async read<T>(key: string): Promise<T | null> {
        try {
            const serializedValue = localStorage.getItem(key);
            if (serializedValue === null) {
                return null;
            }
            return JSON.parse(serializedValue) as T;
        } catch (error) {
            console.error("Error reading from localStorage:", error);
            return Promise.reject(error);
        }
    }

    public async delete(key: string): Promise<void> {
        try {
            localStorage.removeItem(key);
            return Promise.resolve();
        } catch (error) {
            console.error("Error deleting from localStorage:", error);
            return Promise.reject(error);
        }
    }
}

/**
 * @class IndexedDBStorageAdapter
 * @implements {StorageAdapter}
 * @description A robust adapter for the browser's IndexedDB.
 */
class IndexedDBStorageAdapter implements StorageAdapter {
    private db: IDBDatabase | null = null;
    private readonly dbName: string;
    private readonly storeName: string;

    /**
     * @constructor
     * @param {string} dbName - The name of the database.
     * @param {string} storeName - The name of the object store within the database.
     */
    constructor(
        dbName: string = "app-db",
        storeName: string = "key-value-store"
    ) {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    /**
     * Opens and initializes the IndexedDB database.
     * @private
     * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
     */
    private async openDb(): Promise<IDBDatabase> {
        // If the database connection is already open, return it.
        if (this.db) {
            return Promise.resolve(this.db);
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error(
                    "IndexedDB error:",
                    (event.target as IDBOpenDBRequest).error
                );
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    /**
     * Performs a database transaction.
     * @private
     * @param {IDBTransactionMode} mode - The transaction mode ('readonly' or 'readwrite').
     * @param {(store: IDBObjectStore) => IDBRequest} operation - The operation to perform on the store.
     * @returns {Promise<any>} A promise that resolves with the result of the operation.
     */
    private async performTransaction(
        mode: IDBTransactionMode,
        operation: (store: IDBObjectStore) => IDBRequest
    ): Promise<any> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, mode);
            const store = transaction.objectStore(this.storeName);
            const request = operation(store);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error("Transaction error:", request.error);
                reject(request.error);
            };
        });
    }

    public async save(key: string, value: any): Promise<void> {
        await this.performTransaction("readwrite", (store) =>
            store.put(value, key)
        );
    }

    public async read<T>(key: string): Promise<T | null> {
        const result = await this.performTransaction("readonly", (store) =>
            store.get(key)
        );
        return result === undefined ? null : (result as T);
    }

    public async delete(key: string): Promise<void> {
        await this.performTransaction("readwrite", (store) =>
            store.delete(key)
        );
    }
}

// Export an instance of the IndexedDB adapter for general use.
// You can easily swap this out with `new LocalStorageAdapter()` if needed.
// export const storageAdapter = new LocalStorageAdapter();

export const storageAdapter = new IndexedDBStorageAdapter("A_La_Carte", "Data");
