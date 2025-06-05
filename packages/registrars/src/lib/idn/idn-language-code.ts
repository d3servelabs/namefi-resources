const GREEK = /[\u0370-\u03FF]/;
const ARABIC = /[\u0600-\u06FF]/;
const HEBREW = /[\u0370-\u03FF\uFB1D-\uFB4F]/;
const HAN = /[\u4E00-\u9FFF]/;
const KANJI = /[\u4E00-\u9FBF]/;
const HIRAGANA = /[\u3040-\u309F]/;
const KATAKANA = /[\u30A0-\u30FF]/;
// const Cyrillic = /[\u0400-\u04FF]/;
// const Cyrillic_Supplement = /[\u0500-\u052F]/;
// const Cyrillic_Extended_A = /[\u2DE0-\u2DFF]/;
// const Cyrillic_Extended_B = /[\uA640-\uA69F]/;
// const Cyrillic_Extended_C = /[\u1C80-\u1C8F]/;
// const Cyrillic_Extended_D = /[\u1E030-\u1E08F]/; pattern doesn't work in js
// const Cyrillic_Phonetic_Extensions = /[\u1D2B\u1D78]/;
// const Cyrillic_Combining_Half_Marks = /[\uFE2E-\uFE2F]/;
const ALL_CYRILLIC =
  // biome-ignore lint/suspicious/noMisleadingCharacterClass:
  /[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F\u1D2B\u1D78\uFE2E-\uFE2F]/;
const TURKISH_SPECIAL_CHARS =
  /[\uC4B1\uC3A7\uC59F\uC3B6\uC3BC\uC49F\uC4B0\uC387\uC59E\uC396\uC39C\uC49E]/;

export function IdnLanguageCode(name: string) {
  if (TURKISH_SPECIAL_CHARS.test(name)) {
    return 'tr';
  }
  if (ALL_CYRILLIC.test(name)) {
    return 'ru';
  }
  if (ARABIC.test(name)) {
    return 'ar';
  }
  if (GREEK.test(name)) {
    return 'el';
  }
  if (HEBREW.test(name)) {
    return 'he';
  }
  if (HIRAGANA.test(name) || KATAKANA.test(name)) {
    return 'jp';
  }
  if (HAN.test(name)) {
    return 'zh';
    // return 'vi';
    // return 'ko';
  }

  return undefined;
}
export function IdnLanguageCodeISO639_2(name: string) {
  if (TURKISH_SPECIAL_CHARS.test(name)) {
    return 'tur';
  }
  if (ALL_CYRILLIC.test(name)) {
    return 'rus';
  }
  if (ARABIC.test(name)) {
    return 'ara';
  }
  if (GREEK.test(name)) {
    return 'ell';
  }
  if (HEBREW.test(name)) {
    return 'heb';
  }
  if (HIRAGANA.test(name) || KATAKANA.test(name)) {
    return 'jpn';
  }
  if (HAN.test(name)) {
    return 'zho';
    // return 'vi';
    // return 'ko';
  }

  return undefined;
}
