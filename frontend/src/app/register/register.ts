import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceAuth } from '../service-auth';
import { CustomValidators } from '../../lib/custom-validators';
import { Logger } from '../../lib/logger';


@Component({
    selector: 'app-register',
    templateUrl: './register.html',
    styleUrl: './register.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ AsyncPipe, ReactiveFormsModule ],
})
export class Register
{
    private readonly auth = inject(ServiceAuth);
    private readonly router = inject(Router);


    public form = new FormGroup({
        username: new FormControl('', [ Validators.required, Validators.minLength(3), CustomValidators.noChar(/\s/i) ]),
        password: new FormControl('', [ Validators.required, Validators.minLength(3), CustomValidators.noChar(/\s/i) ]),
        passwordRepeat: new FormControl('', [ Validators.required ]),
    }, { validators: [ CustomValidators.matchPasswords ] });

    public errlogs = new Logger();

    public onSubmit()
    {
        if (this.form.controls.username.invalid || this.form.controls.password.invalid)
        {
            this.errlogs.new('Please, provide valid username and password.');
            return;
        }

        this.auth
            .signIn(this.form.value.username!, this.form.value.password!)
            .subscribe((ok) =>
            {
                if (ok)
                {
                    this.errlogs.clear();
                    this.router.navigate([ '/' ]);
                }
                else
                {
                    this.errlogs.new('Invalid credentials.');
                }
            });
    }
}
