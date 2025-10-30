# Mangle Translator vs. Mangle Query Builder

This document explains the roles and differences between two key components of the Mangle system: the `MangleTranslator` and the `MangleQueryBuilder`.

## MangleTranslator

**Purpose:** The `MangleTranslator` is responsible for converting raw, unstructured JSON data into a structured format of "facts" that the Mangle engine can understand. It acts as the bridge between arbitrary data and the Mangle knowledge base.

**Key Functions:**

*   **Input:** Takes a JSON object as input.
*   **Process:** Traverses the JSON object, breaking it down into a flat list of atomic facts. It identifies or generates a primary ID for the root object and links all nested data to this ID.
*   **Output:** Produces an array of Mangle fact strings. Each string represents a single piece of information, such as `product_price("/product/LAP-001", 899.99).`.

**Example:**

Given this JSON:

```json
{
  "sku": "LAP-001",
  "name": "Basic Laptop",
  "specs": {
    "cpu": "i7",
    "ram_gb": 16
  }
}
```

The translator would output:

```
product_name("/product/LAP-001", "Basic Laptop").
product_specs_cpu("/product/LAP-001", "i7").
product_specs_ram_gb("/product/LAP-001", 16).
```

## MangleQueryBuilder

**Purpose:** The `MangleQueryBuilder` is responsible for constructing a valid Mangle Datalog query from a structured Intermediate Representation (IR). It allows for the dynamic creation of queries based on predefined rules and query definitions.

**Key Functions:**

*   **Input:** Takes a `MangleProgramType` object, which contains a set of rules and a list of possible queries. It also takes the *name* of the specific query to build.
*   **Process:** It assembles the Datalog program by combining all the defined rules with the clauses of the single, specified query. It correctly formats variables, literals, and operators according to Mangle syntax.
*   **Output:** Produces a single, multi-line string that represents a complete and executable Mangle Datalog program.

**Example:**

Given a program with a rule and a query, the builder can generate a complete program string to find budget hotels:

```javascript
// Rule:
// is_budget_hotel(HID) :- hotel_price(HID, Price), Price < 150.

// Query:
// is_budget_hotel(HID), hotel_info(HID, Tab, Name).
```

The builder would output:

```
is_budget_hotel(HID) :- hotel_price(HID, Price), Price < 150.

is_budget_hotel(HID), hotel_info(HID, Tab, Name).
```

## Key Differences

| Feature            | MangleTranslator                                | MangleQueryBuilder                                    |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------- |
| **Primary Goal**   | Data Ingestion & Transformation                 | Query Construction & Execution                        |
| **Input**          | Raw JSON object                                 | Structured `MangleProgramType` IR & a query name      |
| **Output**         | An array of individual Mangle fact strings      | A single, complete Mangle program string              |
| **Direction**      | **Data -> Mangle:** Translates external data *into* the Mangle format. | **Mangle -> Query:** Builds a query *for* the Mangle engine. |
| **Analogy**        | The librarian who catalogs books into the library system. | The researcher who uses the library catalog to find specific information. |
