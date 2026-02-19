export type CountryCode = 'KR' | 'US' | string;
export type AgeBand = 'under_13' | '13_15' | '16_18' | 'adult';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AdMode = 'personalized' | 'non_personalized' | 'none';

export interface ConsentState {
  analytics: boolean;
  ad_personalization: boolean;
  guardian_verified_at: string | null;
  updated_at: string | null;
}

export interface User {
  id: string;
  country: CountryCode;
  birth_year: number;
  age: number;
  age_band: AgeBand;
  language_pref: string;
  guardian_contact: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  topic: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  language: string;
  locale: string;
  version: string;
  scenario: string;
  options: string[];
  correct_option: number;
  feedback_by_option: string[];
}

export interface SimulationAttempt {
  id: string;
  user_id: string;
  lesson_id: string;
  topic: string;
  choices: number[];
  rationale_text: string;
  score: number;
  feedback: string;
  completed_at: string;
}

export interface LearningMastery {
  user_id: string;
  topic: string;
  mastery_level: number;
  updated_at: string;
}

export interface AdPolicyResult {
  user_id: string;
  eligible: boolean;
  mode: AdMode;
  policy_rule_id: string;
  reason_code: string;
  placement: string;
}

export interface KpiSnapshot {
  walc: number;
  activation_rate_24h: number;
  d7_retention: number;
  avg_learning_score_improvement: number;
  arpdau_krw: number;
  arpdau_usd: number;
  generated_at: string;
}
