import countryData from 'flag-icons/country.json';

export interface CountryFlag {
  code: string;
  name: string;
}

const EXCLUDED = new Set(['il']);
export const ALL_COUNTRY_FLAGS: CountryFlag[] = countryData
  .map((c: any) => ({ code: c.code, name: c.name }))
  .filter(c => !EXCLUDED.has(c.code));

export const OTHER_FLAGS = ['🏴', '🚀', '🛸', '🌙', '☀️', '⭐', '🌟', '💫', '🔥', '⚡', '❄️'];

export function searchFlags(query: string): CountryFlag[] {
  if (!query.trim()) return ALL_COUNTRY_FLAGS;
  const q = query.toLowerCase();
  return ALL_COUNTRY_FLAGS.filter(
    f => f.name.toLowerCase().includes(q) || f.code.includes(q)
  );
}
