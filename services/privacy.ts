import crypto from 'crypto';

export function hashIdentifier(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 32);
}


