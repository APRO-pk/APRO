const isCountryCode = (code: string) => /^[a-z]{2,4}(-[a-z]{2,4})?$/.test(code) && code.length <= 6;

export function FlagIcon({ code, className = '', size }: { code: string; className?: string; size?: number }) {
  if (!code) return null;
  if (isCountryCode(code)) {
    const s = size || '1em';
    return <span className={`fi fis fi-${code} inline-block align-middle ${className}`} style={{ width: s, height: s }} />;
  }
  return <span className={`inline-block align-middle ${className}`} style={{ fontSize: size || undefined }}>{code}</span>;
}
