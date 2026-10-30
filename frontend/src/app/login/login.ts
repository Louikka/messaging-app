import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceAuth } from '../service-auth';
import { ErrorMessages } from '../../lib/error-messages';


@Component({
    selector: 'app-login',
    imports: [ AsyncPipe, ReactiveFormsModule ],
    templateUrl: './login.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login.css',
})
export class Login
{
    private readonly auth = inject(ServiceAuth);
    private readonly router = inject(Router);

    public form = new FormGroup({
        username: new FormControl('', [ Validators.required ]),
        password: new FormControl('', [ Validators.required ]),
    });

    public errlogs = new ErrorMessages();


    public onSubmit()
    {
        if (this.form.controls.username.invalid || this.form.controls.password.invalid)
        {
            this.errlogs.new('Please, provide valid username and password.');
            return;
        }

        this.auth.logIn(this.form.value.username!, this.form.value.password!).subscribe({
            complete: () =>
            {
                this.errlogs.clear();
                this.router.navigate([ '/chatsRoom' ]);
            },
            error: (err) =>
            {
                console.debug(err);
                this.errlogs.new('Unknown error occured.');
            },
        });
    }
}
