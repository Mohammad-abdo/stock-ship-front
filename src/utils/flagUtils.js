// Country name / code → ISO 2-letter code mapping
const NAME_TO_ISO = {
  // Arabic names
  'السعودية': 'sa', 'المملكة العربية السعودية': 'sa',
  'الإمارات': 'ae', 'الامارات': 'ae',
  'مصر': 'eg', 'الأردن': 'jo', 'الاردن': 'jo',
  'لبنان': 'lb', 'سوريا': 'sy', 'العراق': 'iq',
  'الكويت': 'kw', 'قطر': 'qa', 'البحرين': 'bh',
  'عمان': 'om', 'اليمن': 'ye', 'ليبيا': 'ly',
  'تونس': 'tn', 'الجزائر': 'dz', 'المغرب': 'ma',
  'السودان': 'sd', 'الصين': 'cn', 'الهند': 'in',
  'تركيا': 'tr', 'باكستان': 'pk', 'إيران': 'ir',
  'اليابان': 'jp', 'كوريا': 'kr', 'ألمانيا': 'de',
  'فرنسا': 'fr', 'إيطاليا': 'it', 'إسبانيا': 'es',
  'روسيا': 'ru', 'البرازيل': 'br', 'كندا': 'ca',
  'أستراليا': 'au', 'بريطانيا': 'gb', 'ماليزيا': 'my',
  'إندونيسيا': 'id', 'تايلاند': 'th', 'فيتنام': 'vn',
  'الفلبين': 'ph', 'بنغلاديش': 'bd', 'سنغافورة': 'sg',
  'نيجيريا': 'ng', 'كينيا': 'ke', 'إثيوبيا': 'et',
  'الكاميرون': 'cm', 'غانا': 'gh', 'جنوب أفريقيا': 'za',
  'المكسيك': 'mx', 'الأرجنتين': 'ar', 'نيوزيلندا': 'nz',
  'هولندا': 'nl', 'بلجيكا': 'be', 'سويسرا': 'ch',
  'النمسا': 'at', 'السويد': 'se', 'النرويج': 'no',
  'الدنمارك': 'dk', 'فنلندا': 'fi', 'بولندا': 'pl',
  'أوكرانيا': 'ua', 'أفغانستان': 'af',
  'ساحل العاج': 'ci', 'المكسيك': 'mx',

  // English names
  'SAUDI ARABIA': 'sa', 'SAUDI': 'sa',
  'UNITED ARAB EMIRATES': 'ae', 'UAE': 'ae',
  'EGYPT': 'eg', 'JORDAN': 'jo', 'LEBANON': 'lb',
  'SYRIA': 'sy', 'IRAQ': 'iq', 'KUWAIT': 'kw',
  'QATAR': 'qa', 'BAHRAIN': 'bh', 'OMAN': 'om',
  'YEMEN': 'ye', 'LIBYA': 'ly', 'TUNISIA': 'tn',
  'ALGERIA': 'dz', 'MOROCCO': 'ma', 'SUDAN': 'sd',
  'CHINA': 'cn', 'INDIA': 'in', 'TURKEY': 'tr', 'TURKIYE': 'tr',
  'PAKISTAN': 'pk', 'IRAN': 'ir', 'JAPAN': 'jp',
  'KOREA': 'kr', 'SOUTH KOREA': 'kr',
  'GERMANY': 'de', 'FRANCE': 'fr', 'ITALY': 'it',
  'SPAIN': 'es', 'RUSSIA': 'ru', 'BRAZIL': 'br',
  'CANADA': 'ca', 'AUSTRALIA': 'au',
  'UNITED KINGDOM': 'gb', 'UK': 'gb',
  'UNITED STATES': 'us', 'USA': 'us',
  'MALAYSIA': 'my', 'INDONESIA': 'id', 'THAILAND': 'th',
  'VIETNAM': 'vn', 'PHILIPPINES': 'ph', 'BANGLADESH': 'bd',
  'SINGAPORE': 'sg', 'NIGERIA': 'ng', 'KENYA': 'ke',
  'ETHIOPIA': 'et', 'CAMEROON': 'cm', 'GHANA': 'gh',
  'SOUTH AFRICA': 'za', 'MEXICO': 'mx', 'ARGENTINA': 'ar',
  'NEW ZEALAND': 'nz', 'NETHERLANDS': 'nl', 'BELGIUM': 'be',
  'SWITZERLAND': 'ch', 'AUSTRIA': 'at', 'SWEDEN': 'se',
  'NORWAY': 'no', 'DENMARK': 'dk', 'FINLAND': 'fi',
  'POLAND': 'pl', 'UKRAINE': 'ua', 'AFGHANISTAN': 'af',
  'IVORY COAST': 'ci',
};

// Phone dial code → ISO
const DIAL_TO_ISO = {
  '+966': 'sa', '+971': 'ae', '+20': 'eg', '+962': 'jo',
  '+961': 'lb', '+963': 'sy', '+964': 'iq', '+965': 'kw',
  '+974': 'qa', '+973': 'bh', '+968': 'om', '+967': 'ye',
  '+90': 'tr', '+86': 'cn', '+91': 'in', '+1': 'us',
  '+44': 'gb', '+49': 'de', '+33': 'fr', '+39': 'it',
  '+81': 'jp', '+82': 'kr', '+55': 'br', '+52': 'mx',
  '+92': 'pk', '+98': 'ir', '+234': 'ng', '+254': 'ke',
  '+212': 'ma', '+213': 'dz', '+216': 'tn', '+237': 'cm',
};

/**
 * Convert any country representation to a lowercase ISO 2-letter code.
 * Accepts: "SA", "Saudi Arabia", "السعودية", "+966", etc.
 * Returns: "sa" or null if unrecognised.
 */
export function getCountryCode(value) {
  if (!value) return null;
  const str = String(value).trim();

  // Phone dial code
  if (str.startsWith('+') && DIAL_TO_ISO[str]) return DIAL_TO_ISO[str];

  const upper = str.toUpperCase();

  // Direct name / code match
  if (NAME_TO_ISO[upper]) return NAME_TO_ISO[upper];

  // Already a 2-letter ISO code
  if (/^[A-Z]{2}$/.test(upper)) return upper.toLowerCase();

  // Partial match (e.g. "Saudi" matches "SAUDI")
  for (const [key, iso] of Object.entries(NAME_TO_ISO)) {
    if (upper.includes(key) || key.includes(upper)) return iso;
  }

  return null;
}

/**
 * Get a flag image URL from flagcdn.com
 * @param {string} country - country name, ISO code, or dial code
 * @param {number} width - image width (20, 40, 80, 160, 256)
 * @returns {string} URL to flag PNG
 */
export function getFlagUrl(country, width = 40) {
  const iso = getCountryCode(country);
  if (!iso) return null;
  return `https://flagcdn.com/w${width}/${iso}.png`;
}

/**
 * Resolve country from multiple sources (offer, offerItem, trader).
 * Returns the ISO code (lowercase) or null.
 */
export function resolveCountryCode(...sources) {
  for (const src of sources) {
    const code = getCountryCode(src);
    if (code) return code;
  }
  return null;
}
