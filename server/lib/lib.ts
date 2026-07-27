import crypto from 'crypto';


export function createHashFromString(s: string): string
{
    return crypto.hash('md5', s);
}


export interface HashedPassword {
    hash: string;
    salt: string;
}

export function hashPassword(password: string): HashedPassword
{
    // Generate a random salt (16 bytes)
    const salt = crypto.randomBytes(16).toString('hex');

    // Use scrypt for password hashing (recommended)
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    // Return both salt and hash for storage
    return { hash, salt };
}

/**
 * @param password password to verify.
 * @param hash password to verify against.
 */
export function verifyPassword(password: string, hash: string, salt: string)
{
    const hashedPassword = crypto.scryptSync(password, salt, 64).toString('hex');
    return hashedPassword === hash;
}


export function safeJSONParse<T>(s: string, fallbackValue: T): T
{
    try
    {
        return JSON.parse(s);
    }
    catch (err)
    {
        console.error(err);
    }

    return fallbackValue;
}
