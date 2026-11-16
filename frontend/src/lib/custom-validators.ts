import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';


function test(control: AbstractControl, testFn: (controlsValue: any) => boolean): boolean
{
    if (control instanceof FormControl)
    {
        return testFn(control.value);
    }
    else
    {
        // TODO: handle FormGroup and FormArray (?)
        throw new TypeError('AbstractControl is not an instance of FormControl');
    }
}


export class CustomValidators
{
    /**
     * Returns `disallowedCharacters` validation error if control value
     * contains specified pattern.
     */
    static exclude(regexp: RegExp): ValidatorFn
    {
        const err: ValidationErrors = {
            disallowedCharacters: true,
        };

        return (control) =>
        {
            return test(control, (v) => regexp.test(v)) ? err : null;
        };
    }

    /**
     * Checks if control value contains specified pattern.
     *
     * @returns `disallowedCharacters` validation error if regexp test failed.
     */
    static contains(regexp: RegExp): ValidatorFn
    {
        const err: ValidationErrors = {
            disallowedCharacters: true,
        };

        return (control) =>
        {
            return test(control, (v) => regexp.test(v)) ? null : err;
        };
    }

    /**
     * Checks if control value is non-empty string after trimming. Returns
     * `empty` validation error on failure.
     */
    static nonEmpty(control: AbstractControl): ValidationErrors | null
    {
        const err: ValidationErrors = {
            empty: true,
        };

        const ok = test(control, (v) =>
        {
            if (typeof v === 'string')
            {
                return v.trim() !== '';
            }

            return false;
        });

        return ok ? null : err;
    }

    static matchPasswords(control: AbstractControl): ValidationErrors | null
    {
        // TODO: check type of the AbstractControl

        const p1 = control.get('password');
        const p2 = control.get('passwordRepeat');

        if (p1 === null || p2 === null || p1.value.trim() !== p2.value.trim())
        {
            return {
                mismatchedPasswords: true,
            };
        }

        return null;
    }
}
