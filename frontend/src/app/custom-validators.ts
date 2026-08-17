import { ValidatorFn } from '@angular/forms';


export function disallowCharactersValidator(regex: RegExp): ValidatorFn
{
    return (control) =>
    {
        const haveDisallowedCharacters = regex.test(control.value);

        if (haveDisallowedCharacters)
        {
            return {
                haveDisallowedCharacters,
            };
        }

        return null;
    }
}

export const matchingPasswordsValidator: ValidatorFn = (control) =>
{
    const p1 = control.get('password');
    const p2 = control.get('repeatedPassword');

    if (p1 === null || p2 === null || p1.value.trim() !== p2.value.trim())
    {
        return {
            isPasswordsMismatched: true,
        };
    }

    return null;
};
