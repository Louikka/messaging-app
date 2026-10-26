import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';


export class CustomValidators
{
    static noChar(regex: RegExp): ValidatorFn
    {
        return (control) =>
        {
            const haveDisallowedCharacters = regex.test(control.value);

            if (haveDisallowedCharacters)
            {
                return {
                    disallowedCharacters: true,
                };
            }

            return null;
        }
    }

    /** String should not be empty. */
    static notEmpty(control: AbstractControl): ValidationErrors | null
    {
        throw 'TODO';
    }

    static matchPasswords(control: AbstractControl): ValidationErrors | null
    {
        const p1 = control.get('password');
        const p2 = control.get('repeatedPassword');

        if (p1 === null || p2 === null || p1.value.trim() !== p2.value.trim())
        {
            return {
                mismatchedPasswords: true,
            };
        }

        return null;
    }
}
