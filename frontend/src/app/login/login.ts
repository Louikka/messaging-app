import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceAuth } from '../service-auth';
import { Logger } from '../../lib/logger';


@Component({
    selector: 'app-login',
    templateUrl: './login.html',
    styleUrl: './login.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ AsyncPipe, ReactiveFormsModule ],
})
export class Login
{
    private readonly router = inject(Router);
    private readonly auth = inject(ServiceAuth);


    public form = new FormGroup({
        username: new FormControl('', [ Validators.required ]),
        password: new FormControl('', [ Validators.required ]),
    });

    public errlogs = new Logger();

    public onSubmit()
    {
        if (this.form.controls.username.invalid || this.form.controls.password.invalid)
        {
            this.errlogs.new('Please, provide valid username and password.');
            return;
        }

        this.auth
            .logIn(this.form.value.username!, this.form.value.password!)
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
