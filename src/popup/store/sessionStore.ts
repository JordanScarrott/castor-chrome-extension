import { defineStore } from 'pinia';

// 2. Data Types
export interface Source {
  id: string;
  title: string;
  faviconUrl: string;
  facts: string[];
}

export interface Result {
  type: 'text' | 'table';
  data: any;
}

export interface SessionState {
  sessionTitle: string;
  goal: string | null;
  guidingQuestions: string[];
  knowledgeSources: Source[];
  currentResult: Result | null;
  isLoading: boolean;
}

// Mock delay function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useSessionStore = defineStore('session', {
  // 1. Pinia Store (`src/store/sessionStore.ts`)
  state: (): SessionState => ({
    sessionTitle: '',
    goal: null,
    guidingQuestions: [],
    knowledgeSources: [ // Mock data as requested
        {
            id: '1',
            title: 'Ars Technica: The new M3 MacBook Air.',
            faviconUrl: 'https://arstechnica.com/favicon.ico',
            facts: ['Comes in 13" and 15" models.', 'Supports two external displays (when lid is closed).']
        },
        {
            id: '2',
            title: 'The Verge: Apple’s new M3 MacBook Air is here.',
            faviconUrl: 'https://www.theverge.com/favicon.ico',
            facts: ['Starting price is $1,099.', 'Features a fanless design.']
        }
    ],
    currentResult: null,
    isLoading: false,
  }),

  // Getters
  getters: {
    hasActiveSession(state): boolean {
      return state.goal !== null;
    },
  },

  // Actions
  actions: {
    initSession(title: string) {
      this.sessionTitle = title;
    },

    async setGoal(goalText: string) {
      this.isLoading = true;
      await sleep(2000); // Mock 2-second delay
      this.goal = goalText;
      this.guidingQuestions = [
        'What are the key performance differences?',
        'How does the battery life compare?',
        'What is the starting price for each model?'
      ];
      this.isLoading = false;
    },

    addSource(source: Source) {
      // Stubbed action
      console.log('addSource action called with:', source);
      // this.knowledgeSources.push(source);
    },

    async executeQuery(queryText: string) {
      this.isLoading = true;
      this.currentResult = null;
      await sleep(2000); // Mock 2-second delay

      if (queryText.toLowerCase().includes('compare')) {
        this.currentResult = {
          type: 'table',
          data: {
            headers: ['Feature', 'M3 MacBook Air', 'M2 MacBook Air'],
            rows: [
              ['Price', '$1,099', '$999'],
              ['External Displays', '2 (lid closed)', '1'],
              ['Wi-Fi', 'Wi-Fi 6E', 'Wi-Fi 6'],
            ]
          }
        };
      } else {
        this.currentResult = {
          type: 'text',
          data: {
            answer: 'The M3 MacBook Air offers significant performance improvements, support for an additional external display when the lid is closed, and faster Wi-Fi 6E connectivity compared to the M2 model.'
          }
        };
      }
      this.isLoading = false;
    },
  },
});
