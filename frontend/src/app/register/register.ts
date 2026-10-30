import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceAuth } from '../service-auth';
import { CustomValidators } from '../../lib/custom-validators';
import { ErrorMessages } from '../../lib/error-messages';


@Component({
    selector: 'app-register',
    imports: [ AsyncPipe, ReactiveFormsModule ],
    templateUrl: './register.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './register.css',
})
export class Register
{
    private readonly auth = inject(ServiceAuth);
    private readonly router = inject(Router);

    public form = new FormGroup({
        username: new FormControl('', [ Validators.required, Validators.minLength(3), CustomValidators.noChar(/\s/i) ]),
        password: new FormControl('', [ Validators.required, Validators.minLength(3), CustomValidators.noChar(/\s/i) ]),
        repeatedPassword: new FormControl('', [ Validators.required ]),
    }, { validators: [ CustomValidators.matchPasswords ] });

    public errlogs = new ErrorMessages();


    public onSubmit()
    {
        if (this.form.controls.username.invalid || this.form.controls.password.invalid)
        {
            this.errlogs.new('Please, provide valid username and password.');
            return;
        }

        this.auth.signIn(this.form.value.username!, this.form.value.password!).subscribe({
            complete: () =>
            {
                //alert('Registration was successfull.');
                this.errlogs.clear();
                this.router.navigate([ '/chatsRoom' ]);
            },
            error: (err) =>
            {
                if (err instanceof HttpErrorResponse && err.statusText)
                {
                    this.errlogs.new(err.statusText);
                }
                else
                {
                    console.debug(err);
                    this.errlogs.new('Unknown error occured.');
                }
            },
        });
    }
}
