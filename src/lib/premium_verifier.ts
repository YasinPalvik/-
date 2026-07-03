/**
 * Premium Account & Activation Code Cryptographic Verifier
 * This utility allows offline verification of manually generated premium accounts and activation codes.
 * Admin can generate these credentials from the Admin Panel, and they will be recognized by any client.
 */

/**
 * Generates a deterministic premium password for a given username using a secret custom salt.
 */
export function generatePremiumPassword(username: string): string {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) return "";
  
  // Custom salt to prevent guessing
  const SALT = "medophile_gold_secret_2026";
  const saltedString = cleanUsername + SALT;
  
  let hash = 0;
  for (let i = 0; i < saltedString.length; i++) {
    const char = saltedString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const positiveHash = Math.abs(hash);
  const part1 = (positiveHash % 10000).toString().padStart(4, "0");
  const part2 = ((positiveHash >> 3) % 10000).toString().padStart(4, "0");
  
  return `MP-${part1}-${part2}`;
}

/**
 * Verifies if the provided username and password matches the premium generation signature.
 */
export function verifyPremiumAccount(username: string, passwordHash: string): boolean {
  if (!username || !passwordHash) return false;
  const expectedPassword = generatePremiumPassword(username);
  return passwordHash.trim() === expectedPassword;
}

/**
 * Generates a deterministic premium activation code for an existing user's email.
 */
export function generateActivationCode(email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return "";
  
  const SALT = "medophile_activation_key_2026";
  const saltedString = cleanEmail + SALT;
  
  let hash = 0;
  for (let i = 0; i < saltedString.length; i++) {
    const char = saltedString.charCodeAt(i);
    hash = (hash << 7) - hash + char;
    hash = hash & hash;
  }
  
  const positiveHash = Math.abs(hash);
  const codePart = (positiveHash % 100000).toString().padStart(5, "0");
  
  // Extract a clean alphabetic prefix from email
  let prefix = cleanEmail.split("@")[0].toUpperCase().replace(/[^A-Z]/g, "");
  if (prefix.length < 3) prefix = (prefix + "MEDO").substring(0, 3);
  prefix = prefix.substring(0, 4);
  
  return `GOLD-${prefix}-${codePart}`;
}

/**
 * Verifies if the provided code matches the expected activation code for the given email.
 */
export function verifyActivationCode(email: string, code: string): boolean {
  if (!email || !code) return false;
  const expectedCode = generateActivationCode(email);
  return code.trim().toUpperCase() === expectedCode;
}
