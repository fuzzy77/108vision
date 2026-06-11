import { create } from 'zustand';
import type { OnboardingData } from '@/types';

interface OnboardingState {
  currentStep: number;
  data: OnboardingData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateCompany: (company: Partial<OnboardingData['company']>) => void;
  setUseCases: (useCases: string[]) => void;
  setAgents: (agents: Partial<OnboardingData['agents'][number]>[]) => void;
  setDocuments: (documents: File[]) => void;
  setCrawlUrls: (urls: string[]) => void;
  setUsers: (users: OnboardingData['users']) => void;
  reset: () => void;
}

const initialData: OnboardingData = {
  company: {
    name: '',
    sector: '',
    size: '',
    contactName: '',
    contactEmail: '',
  },
  useCases: [],
  agents: [],
  documents: [],
  crawlUrls: [],
  users: [],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 0,
  data: { ...initialData },
  setStep: (currentStep) => set({ currentStep }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  updateCompany: (company) =>
    set((state) => ({
      data: { ...state.data, company: { ...state.data.company, ...company } },
    })),
  setUseCases: (useCases) =>
    set((state) => ({ data: { ...state.data, useCases } })),
  setAgents: (agents) =>
    set((state) => ({ data: { ...state.data, agents } })),
  setDocuments: (documents) =>
    set((state) => ({ data: { ...state.data, documents } })),
  setCrawlUrls: (crawlUrls) =>
    set((state) => ({ data: { ...state.data, crawlUrls } })),
  setUsers: (users) =>
    set((state) => ({ data: { ...state.data, users } })),
  reset: () => set({ currentStep: 0, data: { ...initialData } }),
}));
