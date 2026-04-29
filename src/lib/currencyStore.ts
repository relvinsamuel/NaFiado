import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_BCV_RATE, normalizeRate } from './currency';

interface CurrencyStore {
  bcvRate: number;
  setBcvRate: (rate: number) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      bcvRate: DEFAULT_BCV_RATE,
      setBcvRate: (rate) => set({ bcvRate: normalizeRate(rate) }),
    }),
    {
      name: 'nafiado-currency',
    }
  )
);
