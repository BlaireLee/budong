import { calculateAge, defaultLanguageForCountry, toAgeBand } from './ageBand.js';

export class SignupService {
  constructor({ userRepository, consentRepository, createId, clock = () => new Date() }) {
    this.userRepository = userRepository;
    this.consentRepository = consentRepository;
    this.createId = createId;
    this.clock = clock;
  }

  signup({ birth_year, country, guardian_contact = null }) {
    if (!Number.isInteger(birth_year) || birth_year < 1900) {
      throw new Error('birth_year must be a valid integer');
    }

    if (typeof country !== 'string' || country.trim().length !== 2) {
      throw new Error('country must be a 2-letter code');
    }

    const normalizedCountry = country.toUpperCase();
    const age = calculateAge(birth_year, this.clock());
    const ageBand = toAgeBand(age);
    const now = this.clock().toISOString();

    const user = {
      id: this.createId('usr'),
      country: normalizedCountry,
      birth_year,
      age,
      age_band: ageBand,
      language_pref: defaultLanguageForCountry(normalizedCountry),
      guardian_contact,
      created_at: now,
    };

    const consentState = this.consentRepository.createForUser(user.id, {
      analytics: false,
      ad_personalization: false,
      guardian_verified_at: null,
      updated_at: now,
    });

    this.userRepository.create(user);

    return {
      user,
      consent_state: consentState,
    };
  }
}
