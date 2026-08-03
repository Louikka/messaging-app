import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Auth } from '../auth';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';


@Component({
    selector: 'app-register',
    imports: [ AsyncPipe ],
    templateUrl: './register.html',
    styleUrl: './register.css',
})
export class Register
{
    @ViewChild('registerUsername')
    private registerUsername: ElementRef<HTMLInputElement> | null = null;
    @ViewChild('registerPassword')
    private registerPassword: ElementRef<HTMLInputElement> | null = null;
    @ViewChild('registerPasswordRepeat')
    private registerPasswordRepeat: ElementRef<HTMLInputElement> | null = null;


    private readonly auth = inject(Auth);
    private readonly router = inject(Router);

    public errorMessage$ = new BehaviorSubject<null | string>(null);


    public onRegisterSubmit(ev: SubmitEvent)
    {
        ev.preventDefault();

        const username = this.registerUsername?.nativeElement.value;
        const password = this.registerPassword?.nativeElement.value;
        const passwordRepeat = this.registerPasswordRepeat?.nativeElement.value;

        if (username === undefined || password === undefined || passwordRepeat === undefined)
        {
            this.errorMessage$.next('Undefined username of password.');
            return;
        }

        if (password !== passwordRepeat)
        {
            this.errorMessage$.next('Passwords are not matching.');
            return;
        }

        this.auth.signIn(username, password).subscribe((ok) =>
        {
            if (ok === null) return;

            if (ok)
            {
                this.router.navigate([ '/chat' ]);
                this.errorMessage$.next(null);
            }
            else
            {
                this.errorMessage$.next('An error occured.');
            }
        });
    }
}
