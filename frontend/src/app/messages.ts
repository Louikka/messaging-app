import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { Auth } from './auth';


interface ChatDisplayMessage {
    type : 'message';
    user: string;
    text: string;
    timestamp: number;
}
interface ChatDisplayError {
    type : 'error';
    text: string;
    timestamp: number;
}

export type ChatDisplayContent = ChatDisplayMessage | ChatDisplayError;


@Injectable({
    providedIn: 'root',
})
export class Messages
{
    constructor()
    {
        // this.getMessages().subscribe((val) =>
        // {
        //     for (const m of val)
        //     {
        //         this.messages$.next(this.newDisplayMessage(m));
        //     }
        // });

        // this.ws$.subscribe((val) =>
        // {
        //     this.messages$.next(this.newDisplayMessage(val));
        // });
    }


    private readonly http = inject(HttpClient);
    //private readonly ws$ = webSocket<ChatMessage>(`ws://${window.location.hostname}:8080`);

    public readonly messages$ = new ReplaySubject<ChatDisplayContent>();


    /** Constructor for new display message. */
    public newDisplayMessage(from: any): ChatDisplayMessage
    {
        return {
            type: 'message',
            user: from.username,
            text: from.text,
            timestamp: from.timestamp,
        };
    }
    /** Constructor for new error message. */
    public newDisplayError(text: string): ChatDisplayError
    {
        return {
            type: 'error',
            text,
            timestamp: Date.now(),
        };
    }


    // public getMessages(): Observable<ChatMessage[]>
    // {
    //     return this.http.get<ChatMessage[]>('/api/messages');
    // }

    public sendMessage(message: string): Observable<null | boolean>
    {
        let isOk = new BehaviorSubject<null | boolean>(null);

        const headers = new HttpHeaders({ 'Content-Type': 'application/json', });

        // http.post won't work unless subscribed ("cold" observable)
        this.http.post(
            '/api/messages',
            JSON.stringify({ message }),
            { headers }
        ).subscribe({
            next: (val) =>
            {
                isOk.next(true);
            },
            error: (err) =>
            {
                console.error(err);
                isOk.next(false);
                this.messages$.next(
                    this.newDisplayError(err)
                );
            },
            complete: () =>
            {
                isOk.next(true);
            },
        });

        return isOk.asObservable();
    }

    public sendClientTestError()
    {
        this.messages$.next(
            this.newDisplayError('test error')
        );
    }
}
