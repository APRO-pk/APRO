import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES: CurrencyInfo[] = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'pkr', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'British Pound' },
  { code: 'jpy', symbol: '¥', name: 'Japanese Yen' },
  { code: 'cny', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'inr', symbol: '₹', name: 'Indian Rupee' },
  { code: 'cad', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'aud', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'aed', symbol: 'د.إ', name: 'UAE Dirham' },
];

interface CurrencyContextType {
  currency: CurrencyInfo;
  setCurrency: (code: string) => void;
  rates: Record<string, number>;
  loading: boolean;
  convert: (usdPrice: number) => number;
  currencies: CurrencyInfo[];
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyInfo>(CURRENCIES[0]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'
        );
        const data = await res.json();
        setRates(data.usd);
      } catch {
        try {
          const res = await fetch(
            'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json'
          );
          const data = await res.json();
          setRates(data.usd);
        } catch {
          // rates stay empty, convert will return usdPrice unchanged
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const setCurrency = useCallback((code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) setCurrencyState(found);
  }, []);

  const convert = useCallback(
    (usdPrice: number): number => {
      if (currency.code === 'usd' || !rates[currency.code]) return usdPrice;
      const converted = usdPrice * rates[currency.code];
      return Math.round(converted * 100) / 100;
    },
    [currency.code, rates]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, rates, loading, convert, currencies: CURRENCIES }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
