/**
 * Contact Channels and WhatsApp Direct Routing Utilities
 */

const COUNTRY_DIALING_CODES: Record<string, string> = {
  'south africa': '27',
  'za': '27',
  'zambia': '260',
  'zm': '260',
  'united kingdom': '44',
  'uk': '44',
  'great britain': '44',
  'united states': '1',
  'usa': '1',
  'us': '1',
  'canada': '1',
  'ca': '1',
  'australia': '61',
  'au': '61',
  'kenya': '254',
  'ke': '254',
  'zimbabwe': '263',
  'zw': '263',
  'nigeria': '234',
  'ng': '234',
  'ghana': '233',
  'gh': '233',
  'botswana': '267',
  'bw': '267',
  'namibia': '264',
  'na': '264',
  'tanzania': '255',
  'tz': '255',
  'india': '91',
  'in': '91',
  'china': '86',
  'cn': '86',
  'germany': '49',
  'de': '49',
  'france': '33',
  'fr': '33',
  'netherlands': '31',
  'nl': '31',
  'uae': '971',
  'united arab emirates': '971',
  'dubai': '971',
};

export function getCountryDialCode(countryName?: string): string {
  if (!countryName) return '27'; // default to SA if unspecified
  const lower = countryName.toLowerCase().trim();
  for (const [key, code] of Object.entries(COUNTRY_DIALING_CODES)) {
    if (lower.includes(key)) return code;
  }
  return '27';
}

/**
 * Sanitizes phone numbers for WhatsApp wa.me links:
 * - Strips all non-digit characters except leading plus
 * - Strips leading '+' (wa.me expects only digits without plus)
 * - Converts national format (e.g. 082 123 4567) to international with country dialing code
 */
export function sanitizeWhatsAppNumber(rawPhone: string, countryName?: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  const dialCode = getCountryDialCode(countryName);

  // If starts with national trunk prefix 0 (e.g. 082 123 4567, 077 123 4567)
  if (cleaned.startsWith('0') && cleaned.length >= 9) {
    cleaned = dialCode + cleaned.substring(1);
  } else if (!cleaned.startsWith(dialCode) && cleaned.length >= 7 && cleaned.length <= 9) {
    cleaned = dialCode + cleaned;
  }

  return cleaned;
}

/**
 * Formats a clean wa.me direct chat link with preloaded contextual message
 */
export function buildWhatsAppLink(phoneOrWhatsApp: string, introMessage?: string, countryName?: string): string {
  const cleanNumber = sanitizeWhatsAppNumber(phoneOrWhatsApp, countryName);
  if (!cleanNumber) return '#';
  const textParam = introMessage ? `?text=${encodeURIComponent(introMessage)}` : '';
  return `https://wa.me/${cleanNumber}${textParam}`;
}

/**
 * Normalizes email address
 */
export function sanitizeEmail(rawEmail?: string): string {
  if (!rawEmail) return '';
  const match = rawEmail.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : rawEmail.trim();
}

/**
 * Formats standard international phone display
 */
export function formatDisplayPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  return rawPhone.trim();
}
