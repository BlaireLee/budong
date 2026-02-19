export function calculateAge(birthYear, referenceDate = new Date()) {
  const referenceYear = referenceDate.getUTCFullYear();
  const age = referenceYear - birthYear;
  return Math.max(0, age);
}

export function toAgeBand(age) {
  if (age <= 12) {
    return 'under_13';
  }

  if (age <= 15) {
    return '13_15';
  }

  if (age <= 18) {
    return '16_18';
  }

  return 'adult';
}

export function defaultLanguageForCountry(country) {
  if ((country ?? '').toUpperCase() === 'KR') {
    return 'ko';
  }

  return 'en';
}
