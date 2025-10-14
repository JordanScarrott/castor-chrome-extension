import { MangleTranslator } from "@/service-worker-2/mangle/MangleTranslator";
import { beforeEach, describe, expect, it } from "vitest";

/**
 * Helper function to sort Mangle facts for consistent, order-independent comparison.
 * @param arr - The array of Mangle fact strings.
 * @returns A sorted array of Mangle fact strings.
 */
const sortFacts = (arr: string[]): string[] => {
    return [...arr].sort();
};

describe("MangleTranslator", () => {
    let translator: MangleTranslator;

    beforeEach(() => {
        // Instantiate a new translator before each test to ensure a clean state.
        translator = new MangleTranslator();
    });

    it("should correctly translate a flat JSON object with primitive types", () => {
        const jsonData = {
            sku: "LAP-001",
            name: "Basic Laptop",
            price: 899.99,
            in_stock: true,
        };

        const result = translator.translate(jsonData, "product");
        const expected = [
            'product_name("/product/LAP-001", "Basic Laptop").',
            'product_price("/product/LAP-001", 899.99).',
            'product_in_stock("/product/LAP-001", true).',
        ];

        expect(sortFacts(result)).toEqual(sortFacts(expected));
    });

    it("should handle nested objects by creating prefixed predicates", () => {
        const jsonData = {
            id: "SPEC-123",
            specs: {
                cpu: "i7",
                ram_gb: 16,
                storage: {
                    type: "SSD",
                    size_gb: 512,
                },
            },
        };

        const result = translator.translate(jsonData, "device");
        const expected = [
            'device_specs_cpu("/device/SPEC-123", "i7").',
            'device_specs_ram_gb("/device/SPEC-123", 16).',
            'device_specs_storage_type("/device/SPEC-123", "SSD").',
            'device_specs_storage_size_gb("/device/SPEC-123", 512).',
        ];

        expect(sortFacts(result)).toEqual(sortFacts(expected));
    });

    it("should process an array of primitives into multiple facts", () => {
        const jsonData = {
            id: "POST-01",
            categories: ["tech", "reviews", "laptops"],
        };

        const result = translator.translate(jsonData, "article");
        const expected = [
            'article_category("/article/POST-01", "tech").',
            'article_category("/article/POST-01", "reviews").',
            'article_category("/article/POST-01", "laptops").',
        ];

        expect(sortFacts(result)).toEqual(sortFacts(expected));
    });

    it("should process an array of objects by creating intermediate entities", () => {
        const jsonData = {
            order_id: "ORD-101",
            items: [
                { product_id: "P-A1", quantity: 2, price: 25.5 },
                { product_id: "P-B2", quantity: 1, price: 50.0 },
            ],
        };

        const result = translator.translate(jsonData, "order");
        const expected = [
            // Link from parent to new intermediate entities
            'order_item("/order/ORD-101/item/0", "/order/ORD-101").',
            'order_item("/order/ORD-101/item/1", "/order/ORD-101").',
            // Facts describing the first intermediate entity
            'order_item_product_id("/order/ORD-101/item/0", "P-A1").',
            'order_item_quantity("/order/ORD-101/item/0", 2).',
            'order_item_price("/order/ORD-101/item/0", 25.5).',
            // Facts describing the second intermediate entity
            'order_item_product_id("/order/ORD-101/item/1", "P-B2").',
            'order_item_quantity("/order/ORD-101/item/1", 1).',
            'order_item_price("/order/ORD-101/item/1", 50.0).',
        ];

        expect(sortFacts(result)).toEqual(sortFacts(expected));
    });

    it("should generate a UUID for the primary ID if no standard ID key is found", () => {
        const jsonData = {
            title: "My Document",
            author: "Jane Doe",
        };

        const result = translator.translate(jsonData, "document");
        expect(result).toHaveLength(2);

        // Check that a valid UUID-based ID was created and used for all facts
        const idMatch = result[0].match(/^\w+\(\"(\/document\/[\w-]+)\",/);
        expect(idMatch).not.toBeNull();
        const generatedId = idMatch![1];

        expect(result[0].startsWith(`document_title("${generatedId}",`)).toBe(
            true
        );
        expect(result[1].startsWith(`document_author("${generatedId}",`)).toBe(
            true
        );
    });

    it("should correctly handle null and undefined values by omitting them", () => {
        const jsonData = {
            id: "DATA-01",
            value: 100,
            notes: null, // Should be ignored
            description: undefined, // Should be ignored
        };

        const result = translator.translate(jsonData, "record");
        const expected = ['record_value("/record/DATA-01", 100).'];

        expect(result).toEqual(expected);
    });

    it("should correctly escape double quotes within string values", () => {
        const jsonData = {
            id: "QUOTE-01",
            text: 'He said, "This is a test!"',
        };

        const result = translator.translate(jsonData, "quote");
        const expected = [
            'quote_text("/quote/QUOTE-01", "He said, \\"This is a test!\\"").',
        ];

        expect(result).toEqual(expected);
    });

    it("should return an empty array for invalid input like null, undefined, or non-objects", () => {
        expect(translator.translate(null)).toEqual([]);
        expect(translator.translate(undefined)).toEqual([]);
        expect(translator.translate(123)).toEqual([]);
        expect(translator.translate("a string")).toEqual([]);
    });

    it("should handle a complex, deeply nested JSON object correctly", () => {
        const complexJson = {
            sku: "CMP-001",
            name: "Gaming PC",
            components: {
                cpu: { brand: "Intel", model: "i9" },
                gpu: { brand: "NVIDIA", model: "RTX 4090" },
                ram: [
                    { brand: "Corsair", size_gb: 16 },
                    { brand: "Corsair", size_gb: 16 },
                ],
            },
            accessories: ["mouse", "keyboard"],
        };

        const result = translator.translate(complexJson, "computer");
        const expected = [
            'computer_name("/computer/CMP-001", "Gaming PC").',
            'computer_components_cpu_brand("/computer/CMP-001", "Intel").',
            'computer_components_cpu_model("/computer/CMP-001", "i9").',
            'computer_components_gpu_brand("/computer/CMP-001", "NVIDIA").',
            'computer_components_gpu_model("/computer/CMP-001", "RTX 4090").',
            'computer_components_ram("/computer/CMP-001/ram/0", "/computer/CMP-001").',
            'computer_components_ram_brand("/computer/CMP-001/ram/0", "Corsair").',
            'computer_components_ram_size_gb("/computer/CMP-001/ram/0", 16).',
            'computer_components_ram("/computer/CMP-001/ram/1", "/computer/CMP-001").',
            'computer_components_ram_brand("/computer/CMP-001/ram/1", "Corsair").',
            'computer_components_ram_size_gb("/computer/CMP-001/ram/1", 16).',
            'computer_accessory("/computer/CMP-001", "mouse").',
            'computer_accessory("/computer/CMP-001", "keyboard").',
        ];

        expect(sortFacts(result)).toEqual(sortFacts(expected));
    });
});
