import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';


@Component({
    selector: 'app-home',
    imports: [],
    templateUrl: './home.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './home.css',
})
export class Home
{
    private readonly router = inject(Router);


    public onSignIn(ev: Event)
    {
        this.router.navigate([ '/register' ]);
    }

    public onLogIn(ev: Event)
    {
        this.router.navigate([ '/login' ]);
    }
}
