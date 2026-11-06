/** Checks if value is non-empty string. */
export function isNonEmptyString(v: any): v is string
{
    return typeof v === 'string' && v.length > 0;
}

export function throwError(err: Error | string): never
{
    if (typeof err === 'string')
    {
        throw new Error(err);
    }
    else
    {
        throw err;
    }
}


export function getEnvKey(key: string, fallback?: string): string
{
    const v = process.env[key];
    if (v === undefined)
    {
        if (fallback === undefined)
        {
            throw new Error(`Cannot get enviroment key "${key}".`);
        }
        else
        {
            return fallback;
        }
    }

    return v;
}

export function verifyUserRegisterCredentials(username: string, password: string): boolean
{
    if (!username || !password) return false;

    const usernameIncludesForbiddenSymbols = /\s/i.test(username);
    const passwordIncludesForbiddenSymbols = /\s/i.test(password);

    const correctUsernameLength = username.length >= 3;
    const correctPasswordLength = password.length >= 3;

    return (
        !usernameIncludesForbiddenSymbols
        && !passwordIncludesForbiddenSymbols
        && correctUsernameLength
        && correctPasswordLength
    );
}
