export const PHONE_COUNTRY_CODES = [
  "+359",
  "+30",
  "+31",
  "+32",
  "+33",
  "+34",
  "+39",
  "+40",
  "+41",
  "+43",
  "+44",
  "+45",
  "+46",
  "+47",
  "+48",
  "+49",
  "+351",
  "+352",
  "+353",
  "+354",
  "+355",
  "+356",
  "+357",
  "+358",
  "+36",
  "+380",
  "+381",
  "+382",
  "+383",
  "+385",
  "+386",
  "+387",
  "+389",
  "+420",
  "+421",
  "+423",
  "+90",
  "+1",
  "+61",
  "+81",
] as const;

export function extractPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatStructuredPhone(countryCode: string, localNumber: string) {
  const normalizedCountryCode = countryCode.startsWith("+") ? countryCode : `+${extractPhoneDigits(countryCode)}`;
  const localDigits = extractPhoneDigits(localNumber);
  const digitsWithoutPrefix = localDigits.startsWith("0") ? localDigits.slice(1) : localDigits;

  return `${normalizedCountryCode} ${digitsWithoutPrefix || localDigits}`.trim();
}

export function splitStructuredPhone(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);

  if (!match) {
    return {
      countryCode: "+359",
      phoneNumber: extractPhoneDigits(trimmed),
    };
  }

  return {
    countryCode: match[1] ?? "+359",
    phoneNumber: extractPhoneDigits(match[2] ?? ""),
  };
}
