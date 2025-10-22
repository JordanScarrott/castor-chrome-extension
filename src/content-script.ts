import { ElementSelector } from "@/element-selector";

let elementSelector: ElementSelector | null = null;

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "ACTIVATE_SELECTION_MODE") {
        if (elementSelector) {
            return;
        }
        elementSelector = new ElementSelector(() => {
            elementSelector = null;
        });
        elementSelector.start();
    }
});

function extract(): void {
    // 1. Select all the list items that represent a hotel property.
    //    Booking.com seems to use a `data-testid` for the list container.
    // const hotelListContainer = document.querySelector(
    //     '[data-property-index="property-list-container"]'
    // );
    const hotelElements = Array.from(
        document.querySelectorAll("li[data-property-index]")
    ) as HTMLLIElement[];

    // 2. Map over each element and run our extraction function
    if (hotelElements.length > 0) {
        const allHotelsData = hotelElements.map((element) =>
            extractHotelInfo(element)
        );

        // 3. Now you have an array of structured hotel data!
        console.log("All hotel data: ", allHotelsData);

        // You can now send this `allHotelsData` array to your Mangle engine.
        chrome.runtime.sendMessage({
            type: "HOTEL_DATA_EXTRACTED",
            payload: { hotelData: allHotelsData },
        });
    } else {
        console.log("No hotel listings found on the page.");
    }
}
setTimeout(() => extract(), 5000);

// Define the structure for our extracted hotel data
interface HotelInfo {
    name: string | null;
    rating: number | null;
    locationScore: number | null;
    price: number | null;
    imageUrl: string | null;
    roomType: string | null;
}

/**
 * Parses a single hotel list item element from Booking.com to extract key details.
 * @param hotelElement The HTMLLIElement representing a single hotel.
 * @returns An object of type HotelInfo containing the extracted data.
 */
function extractHotelInfo(hotelElement: HTMLLIElement): HotelInfo {
    // Helper function to safely query and get text content
    const getText = (selector: string): string | null => {
        const element = hotelElement.querySelector(selector);
        return element ? element.textContent?.trim() || null : null;
    };

    // Helper function to parse numbers from strings (e.g., "ZAR 7,054" -> 7054)
    const parseNumber = (text: string | null): number | null => {
        if (!text) return null;
        const match = text.match(/[\d,.]+/); // Find the first sequence of digits, commas, or dots
        return match ? parseFloat(match[0].replace(/,/g, "")) : null;
    };

    // Extract the raw text using specific selectors
    const name = getText('h2[data-testid="header-title"]');
    const ratingText = getText("div.dff2e52086");
    const locationScoreText = getText("div.a9918d47bf");
    const priceText = getText('span[data-testid="price-and-discounted-price"]');
    const roomTypeText = getText("div.addcd77418");

    // Extract the background image URL
    const imageDiv = hotelElement.querySelector(
        "div.d8ee407101"
    ) as HTMLDivElement | null;
    const imageUrlRaw = imageDiv ? imageDiv.style.backgroundImage : null;
    // The raw URL is in the format: url("..."), so we extract the content inside
    const imageUrl = imageUrlRaw ? imageUrlRaw.slice(5, -2) : null;

    // Clean and convert the extracted data
    const hotelData: HotelInfo = {
        name: name,
        rating: parseNumber(ratingText),
        locationScore: parseNumber(locationScoreText),
        price: parseNumber(priceText),
        imageUrl: imageUrl,
        roomType: roomTypeText ? roomTypeText.replace(":", "") : null,
    };

    return hotelData;
}
