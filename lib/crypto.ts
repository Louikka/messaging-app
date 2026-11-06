import * as crypto from 'node:crypto';


export function uuid(): string
{
    return crypto.randomUUID();
}


/** Creates hash from string. */
export function hash(v: string): string
{
    return crypto.hash('md5', v);
}


export interface SaltedHash {
    hash: string;
    salt: string;
}

/**
 * Checks if provided value can be mapped onto {@link SaltedHash} (basically,
 * an object that has `hash` and `salt` properties).
 */
export function isSaltedHashObject(v: any): v is SaltedHash
{
    return (
        typeof v === 'object'
        && v !== null
        && !Array.isArray(v)

        && Object.hasOwn(v, 'hash')
        && Object.hasOwn(v, 'salt')
        && typeof v['hash'] === 'string'
        && typeof v['salt'] === 'string'
    );
}

/** Creates hash with salt from string. */
export function hashS(v: string): SaltedHash
{
    // Generate a random salt (16 bytes)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(v, salt, 64).toString('hex');
    return { hash, salt };
}

export function validateSaltedHash(v: string, sh: SaltedHash): boolean
export function validateSaltedHash(v: string, hash: string, salt: string): boolean
export function validateSaltedHash(v: string, hashOrSh: string | SaltedHash, salt?: string): boolean
{
    let _hash: string;
    let _salt: string;

    if (isSaltedHashObject(hashOrSh))
    {
        _hash = hashOrSh.hash;
        _salt = hashOrSh.salt;
    }
    else if (typeof hashOrSh === 'string' && typeof salt === 'string')
    {
        _hash = hashOrSh;
        _salt = salt;
    }
    else
    {
        throw new TypeError('This should never throw. Otherwise use Typescript.');
    }

    const hashed = crypto.scryptSync(v, _salt, 64).toString('hex');
    return hashed === _hash;
}
