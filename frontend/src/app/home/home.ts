import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomValidators } from '../../lib/custom-validators';
import { ServiceAuth } from '../service-auth';


type FormType = 'login' | 'register';

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrl: './home.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ ReactiveFormsModule ],
})
export class Home
{
    private readonly router = inject(Router);

    private readonly auth = inject(ServiceAuth);


    public formType: FormType = 'login'; // login form as default

    public formLogin = new FormGroup({
        username: new FormControl('', [ Validators.required ]),
        password: new FormControl('', [ Validators.required ]),
    });

    public formRegister = new FormGroup({
        username: new FormControl('', [ Validators.required, Validators.minLength(3), CustomValidators.noChar(/\s/i) ]),
        password: new FormControl('', [ Validators.required, Validators.minLength(3), CustomValidators.noChar(/\s/i) ]),
        passwordRepeat: new FormControl('', [ Validators.required ]),
    }, {
        validators: [ CustomValidators.matchPasswords ]
    });

    public switchFormType(type: FormType)
    {
        if (type !== this.formType) this.formType = type;
    }

    public onLoginSubmit()
    {
        this.auth.logIn(this.formLogin.value.username!, this.formLogin.value.password!).subscribe({
            complete: () =>
            {
                this.router.navigate([ '/' ]);
            },
            error: (err) =>
            {
                console.debug(err);
            },
        });
    }

    public onRegisterSubmit()
    {
        this.auth.signIn(this.formRegister.value.username!, this.formRegister.value.password!).subscribe({
            complete: () =>
            {
                this.router.navigate([ '/' ]);
            },
            error: (err) =>
            {
                console.debug(err);
            },
        });
    }
}
