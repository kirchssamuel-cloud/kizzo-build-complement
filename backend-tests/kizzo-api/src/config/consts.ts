/**
 * Constantes métier partagées par les modules Kizzo.
 */

// Authentification — RG-01 P01
export const PASSWORD_MIN_LENGTH = 8;
export const BCRYPT_ROUNDS = 12;
export const EMAIL_VERIFICATION_TTL_MS = 60 * 60 * 1000; // 1 heure
export const PASSWORD_RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
/// Verrouillage du compte parent après 5 tentatives échouées (RG-01).
export const LOGIN_MAX_FAILED_ATTEMPTS = 5;
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Profils enfants
export const MAX_CHILDREN_PER_PARENT = 6; // RG-17
export const MAX_DEVICES_PER_CHILD = 3; // RG-18
export const CHILD_MIN_AGE = 2;
export const CHILD_MAX_AGE = 18;

// Appairage appareil
export const DEVICE_PAIRING_CODE_TTL_MS = 15 * 60 * 1000; // RG-18 : 15 min
export const DEVICE_PAIRING_CODE_LENGTH = 6;

// Défis éducatifs — RG-12 à RG-16
export const DEFI_MIN_QUESTIONS = 3;
export const DEFI_MAX_QUESTIONS = 10;
export const DEFI_DEFAULT_THRESHOLD = 70; // %
export const DEFI_MAX_ATTEMPTS_PER_DAY = 3; // RG-14
export const DEFI_HISTORY_RETENTION_DAYS = 365; // RG-16

// Temps d'écran — RG-01 à RG-06
export const QUOTA_WARNING_BEFORE_MIN = 15; // RG-02
export const NIGHT_MODE_DEFAULT_START = '21:00'; // RG-06
export const NIGHT_MODE_DEFAULT_END = '07:00';

// Anonymisation
export const ACCOUNT_DELETION_RETENTION_DAYS = 30; // RG-20
