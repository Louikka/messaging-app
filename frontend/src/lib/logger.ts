import { BehaviorSubject } from 'rxjs';


export class Logger
{
    public logs$ = new BehaviorSubject<string | null>(null);


    public new(message?: string | null)
    {
        this.logs$.next(message ?? null);
    }

    public clear()
    {
        this.logs$.next(null);
    }
}
