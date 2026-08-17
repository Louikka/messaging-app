import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { BehaviorSubject, distinctUntilChanged, filter } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../auth';
import { disallowCharactersValidator, matchingPasswordsValidator } from '../custom-validators';


@Component({
    selector: 'app-register',
    imports: [ AsyncPipe, ReactiveFormsModule ],
    templateUrl: './register.html',
    styleUrl: './register.css',
})
export class Register implements OnInit
{
    private readonly auth = inject(Auth);
    private readonly router = inject(Router);

    public form = new FormGroup({
        username: new FormControl('', [ Validators.required, Validators.minLength(3), disallowCharactersValidator(/\s/i) ]),
        password: new FormControl('', [ Validators.required, Validators.minLength(3) ]),
        repeatedPassword: new FormControl('', [ Validators.required, Validators.minLength(3) ]),
    }, { validators: [ matchingPasswordsValidator ] });

    public errorMessage$ = new BehaviorSubject<string | null>(null);


    ngOnInit()
    {
        this.form.controls.username.statusChanges
            .subscribe(status =>
            {
                if (status === 'INVALID')
                {
                    // report that username contains invalid characters
                }
            });
    }

    public onSubmit()
    {
        if (this.form.valid)
        {
            const username = this.form.value.username!.trim();
            const password = this.form.value.password!.trim();

            this.auth.signIn(username, password).subscribe({
                complete: () =>
                {
                    //this.router.navigate([ '/chat' ]);
                    alert('Registration was successfull.');
                    this.errorMessage$.next(null);
                },
                error: (err) =>
                {
                    if (err instanceof HttpErrorResponse)
                    {
                        console.log(err);
                        this.errorMessage$.next(err.statusText);
                    }
                    else
                    {
                        console.debug(err);
                        this.errorMessage$.next('Unknown error occured.');
                    }
                },
            });
        }
        else
        {
            if (!this.form.controls.username.valid || !this.form.controls.password.valid)
            {
                this.errorMessage$.next('Please, provide valid username and password.');
            }
        }
    }
}
