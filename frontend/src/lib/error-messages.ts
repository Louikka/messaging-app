import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';


export class ErrorMessages
{
    public messages$ = new BehaviorSubject<string | null>(null);


    public fromError(err: Error)
    {
        if (err instanceof HttpErrorResponse) this.messages$.next(err.error.error);
        else this.messages$.next(err.message);
    }

    public new(message?: string | null)
    {
        this.messages$.next(message ?? null);
    }

    public clear()
    {
        this.messages$.next(null);
    }
}
