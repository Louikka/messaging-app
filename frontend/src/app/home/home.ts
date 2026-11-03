import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomValidators } from '../../lib/custom-validators';
import { ServiceAuth } from '../service-auth';
import { Logger } from '../../lib/logger';


type FormType = 'login' | 'register';

@Component({
    selector: 'app-home',
    templateUrl: './home.html',
    styleUrl: './home.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ ReactiveFormsModule, AsyncPipe ],
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
        if (type !== this.formType)
        {
            this.formType = type;
            this.errlogs.clear();
        }
    }


    public errlogs = new Logger();

    private _onSubmitResponse(success: boolean)
    {
        if (success)
        {
            this.errlogs.clear();
            this.router.navigate([ '/' ]);
        }
        else
        {
            this.errlogs.new('Invalid credentials.');
        }
    }


    public onLoginSubmit()
    {
        if (this.formLogin.controls.username.invalid || this.formLogin.controls.password.invalid)
        {
            this.errlogs.new('Please, provide valid username and password.');
            return;
        }

        this.auth
            .logIn(this.formLogin.value.username!, this.formLogin.value.password!)
            .subscribe((ok) => this._onSubmitResponse(ok));
    }

    public onRegisterSubmit()
    {
        if (this.formRegister.controls.username.invalid || this.formRegister.controls.password.invalid)
        {
            this.errlogs.new('Please, provide valid username and password.');
            return;
        }

        this.auth
            .signIn(this.formRegister.value.username!, this.formRegister.value.password!)
            .subscribe((ok) => this._onSubmitResponse(ok));
    }
}
