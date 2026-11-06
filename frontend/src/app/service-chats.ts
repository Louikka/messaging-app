import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { ServiceAuth } from './service-auth';


@Injectable({
    providedIn: 'root',
})
export class ServiceChats
{
    private readonly http = inject(HttpClient);
    private readonly auth = inject(ServiceAuth);


    public chats$ = new BehaviorSubject<APIUserChat[]>([]);

    public getChatSignature(chatId: string): APIUserChat | null
    {
        return this.chats$.value.find(c => c.id === chatId) ?? null;
    }

    public updateChats()
    {
        // do not forget to force refresh user
        this.auth.getUser(true).subscribe((user) =>
        {
            if (user === null)
            {
                console.warn('Cannot update user chats: cannot get user.');
                return;
            }

            this.chats$.next(user.chats);
        });
    }

    /**
     * @note updates chats automatically.
     */
    public addNewChat(name: string): Observable<APIUserChat | null>
    {
        const url = '/api/chat/create';
        const body = { chat_name: name };

        return this.http.post<APIUserChat>(url, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }).pipe(
            tap(() => this.updateChats()),
            catchError((err) =>
            {
                console.error('Error while trying to add new chat:', err);
                return of(null);
            }),
        );
    }
}
