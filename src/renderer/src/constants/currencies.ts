// Static exchange rates vs USD (1 USD = rate units of currency)
export const CURRENCY_RATES_USD: Record<string, number> = {
  USD: 1, AED: 3.6725, AFN: 62.72336, ALL: 82.521752, AMD: 376.94236, ANG: 1.79, AOA: 921.717947,
  ARS: 1452.25, AUD: 1.421306, AWG: 1.79, AZN: 1.697532, BAM: 1.683832, BBD: 2, BDT: 122.299479,
  BGN: 1.667322, BHD: 0.376, BIF: 2973.200244, BMD: 1, BND: 1.277495, BOB: 6.9288, BRL: 5.252706,
  BSD: 1, BTN: 92.10895, BWP: 13.655326, BYN: 2.894481, BZD: 2, CAD: 1.368024, CDF: 2219.736729,
  CHF: 0.783035, CLF: 0.022296, CLP: 881.297449, CNH: 6.912916, CNY: 6.915072, COP: 3762.973804,
  CRC: 470.276781, CUP: 24, CVE: 94.930411, CZK: 20.962518, DJF: 177.721, DKK: 6.426558,
  DOP: 59.961347, DZD: 130.462075, EGP: 49.85749, ERN: 15, ETB: 155.826993, EUR: 0.860948,
  FJD: 2.200577, FKP: 0.749706, FOK: 6.426392, GBP: 0.749722, GEL: 2.700684, GGP: 0.749706,
  GHS: 10.778945, GIP: 0.749706, GMD: 74.18558, GNF: 8759.397426, GTQ: 7.661381, GYD: 209.163414,
  HKD: 7.804472, HNL: 26.445776, HRK: 6.486675, HTG: 131.127651, HUF: 332.823352, IDR: 16885.701589,
  ILS: 3.098143, IMP: 0.749706, INR: 92.108456, IQD: 1307.749526, IRR: 1314148.904942, ISK: 123.990338,
  JEP: 0.749706, JMD: 156.422763, JOD: 0.709, JPY: 157.706313, KES: 129.107232, KGS: 87.440877,
  KHR: 4026.142089, KID: 1.421315, KMF: 423.549635, KRW: 1477.311478, KWD: 0.307019, KYD: 0.833333,
  KZT: 499.667979, LAK: 21580.768049, LBP: 89500, LKR: 309.264124, LRD: 183.069241, LSL: 16.482979,
  LYD: 6.341981, MAD: 9.284892, MDL: 17.15372, MGA: 4185.990244, MKD: 52.73358, MMK: 2094.872236,
  MNT: 3597.51047, MOP: 8.038902, MRU: 40.067977, MUR: 46.855539, MVR: 15.429044, MWK: 1745.536308,
  MXN: 17.654123, MYR: 3.942914, MZN: 63.555704, NAD: 16.482979, NGN: 1359.970978, NIO: 36.769501,
  NOK: 9.671123, NPR: 147.37432, NZD: 1.697866, OMR: 0.384497, PAB: 1, PEN: 3.392481, PGK: 4.309892,
  PHP: 58.496743, PKR: 279.490668, PLN: 3.694077, PYG: 6478.014912, QAR: 3.64, RON: 4.387202,
  RSD: 100.603544, RUB: 77.588531, RWF: 1462.74549, SAR: 3.75, SBD: 7.929004, SCR: 14.387057,
  SDG: 449.7348, SEK: 9.260543, SGD: 1.277508, SHP: 0.749706, SLE: 24.480065, SLL: 24480.064783,
  SOS: 570.898839, SRD: 37.788831, SSP: 4590.863616, STN: 21.092777, SYP: 112.147581, SZL: 16.482979,
  THB: 31.653168, TJS: 9.392701, TMT: 3.500027, TND: 2.897359, TOP: 2.360441, TRY: 43.966313,
  TTD: 6.734486, TVD: 1.421315, TWD: 31.713944, TZS: 2533.260756, UAH: 43.39076, UGX: 3632.442443,
  UYU: 38.444102, UZS: 12214.845753, VES: 425.6741, VND: 26063.763837, VUV: 118.626309, WST: 2.677416,
  XAF: 564.732847, XCD: 2.7, XCG: 1.79, XDR: 0.733192, XOF: 564.732847, XPF: 102.73646,
  YER: 238.135434, ZAR: 16.482907, ZMW: 19.132097, ZWG: 25.7665, ZWL: 25.7665,
}

/** Currency code → symbol map (ISO 4217 graphemes; source: xsolla/currency-format). Fallback: code. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: '.د.إ', AFN: '؋', ALL: 'Lek', AMD: 'դր.', ANG: 'NAƒ', AOA: 'Kz', ARS: '$', AUD: 'A$', AWG: 'Afl',
  AZN: '₼', BAM: 'KM', BBD: '$', BDT: '৳', BGN: 'лв', BHD: '.د.ب', BIF: 'FBu', BMD: 'BD$', BND: '$',
  BOB: 'Bs.', BRL: 'R$', BSD: '$', BTN: 'Nu.', BWP: 'P', BYN: 'р.', BZD: 'BZ$', CAD: 'CA$', CDF: 'FC',
  CHF: 'fr.', CLF: 'UF', CLP: '$', CNH: '¥', CNY: '元', COP: '$', CRC: '₡', CUP: '$MN', CVE: 'esc',
  CZK: 'Kč', DJF: 'Fdj', DKK: 'kr', DOP: 'RD$', DZD: '.د.ج', EGP: '.ج.م', ERN: 'Nkf', ETB: 'Br',
  EUR: '€', FJD: 'FJ$', FKP: '£', FOK: 'kr', GBP: '£', GEL: '₾', GGP: '£', GHS: 'GH₵', GIP: '£',
  GMD: 'D', GNF: 'GFr', GTQ: 'Q', GYD: 'GY$', HKD: 'HK$', HNL: 'L', HRK: 'kn', HTG: 'G', HUF: 'Ft',
  IDR: 'Rp', ILS: '₪', IMP: '£', INR: '₹', IQD: '.د.ع', IRR: '﷼', ISK: 'kr', JEP: '£', JMD: 'J$',
  JOD: '.د.إ', JPY: '¥', KES: 'KSh', KGS: 'сом', KHR: '៛', KID: '$', KMF: 'CF', KRW: '₩', KWD: '.د.ك',
  KYD: 'CI$', KZT: '₸', LAK: '₭', LBP: '.ل.ل', LKR: '₨', LRD: 'L$', LSL: 'L', LYD: '.د.ل', MAD: '.د.م',
  MDL: 'lei', MGA: 'Ar', MKD: 'ден', MMK: 'K', MNT: '₮', MOP: 'MOP$', MRU: 'UM', MUR: '₨', MVR: 'MVR',
  MWK: 'MK', MXN: '$', MYR: 'RM', MZN: 'MT', NAD: 'N$', NGN: '₦', NIO: 'C$', NOK: 'kr', NPR: '₨',
  NZD: 'NZ$', OMR: '.ر.ع', PAB: 'B/.', PEN: 'S/', PGK: 'K', PHP: '₱', PKR: '₨', PLN: 'zł', PYG: 'Gs',
  QAR: '.ر.ق', RON: 'lei', RSD: 'Дин.', RUB: '₽', RWF: 'R₣', SAR: '.ر.س', SBD: 'SI$', SCR: '₨',
  SDG: 'SDG', SEK: 'kr', SGD: 'S$', SHP: '£', SLE: 'Le', SLL: 'Le', SOS: 'S', SRD: '$', SSP: 'SS£',
  STN: 'Db', SYP: '.ل.س', SZL: 'L', THB: '฿', TJS: 'SM', TMT: 'T', TND: '.د.ت', TOP: 'T$', TRY: '₺',
  TTD: 'TT$', TVD: '$', TWD: 'NT$', TZS: 'TSh', UAH: '₴', UGX: 'USh', USD: '$', UYU: '$U', UZS: "so'm",
  VES: 'Bs', VND: '₫', VUV: 'VT', WST: 'WS$', XAF: 'FCFA', XCD: 'EC$', XCG: 'ƒ', XDR: 'SDR',
  XOF: 'CFA', XPF: '₣', YER: '.ر.ي', ZAR: 'R', ZMW: 'K', ZWG: 'Z$', ZWL: 'Z$',
}

/** Returns the display symbol for a currency code; falls back to the code if unknown. */
export function getCurrencySymbol(code: string | null | undefined): string {
  if (code == null || code === '') return ''
  return CURRENCY_SYMBOLS[code] ?? code
}

export const CURRENCY_CODES = Object.keys(CURRENCY_RATES_USD).sort()
