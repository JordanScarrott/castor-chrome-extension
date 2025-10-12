// import { analyzeHotelData } from "@/service-worker-2/handlers/contentHandler";
import { defineStore } from "pinia";
import { ref, Ref } from "vue";

export const useContentStore = defineStore("contentStore", () => {
    // const hotelData: Ref<HotelInfo[]> = ref<HotelInfo[]>([]);
    // function setHotelInfo(data: HotelInfo[]): void {
    //     hotelData.value = data;
    // }
    // async function analyseHotelInfo(): Promise<
    //     {
    //         question: string;
    //         answer: any;
    //     }[]
    // > {
    //     hotelData.value = JSON.parse(
    //         localStorage.get("hotelInfo")
    //     ) as HotelInfo[];
    //     const result = await analyzeHotelData(hotelData.value);
    //     console.log("mangle result", result);
    //     return result;
    // }
    // return { hotelData, setHotelInfo, analyseHotelInfo };
});
