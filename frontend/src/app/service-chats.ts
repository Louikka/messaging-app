import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ServiceAuth } from './service-auth';


interface Chat {
    id: string;
    name: string;
    owner: string | null;
}


@Injectable({
    providedIn: 'root',
})
export class ServiceChats
{
    private readonly http = inject(HttpClient);
    private readonly auth = inject(ServiceAuth)

    public chats$ = new BehaviorSubject<Chat[]>([]);


    // public isUserInChat(chatID: string): Observable<boolean>
    // {
    //     return this.http.get<GETChatCreateResponse>(`/api/chat/id/${chatID}`).pipe(
    //         map((v) => true),
    //         catchError((err) => of(false)),
    //     );
    // }

    public addNewChat(name: string)
    {
        return this.http.post<{
            id: string;
            name: string;
            owner: string;
        }>('/api/chat/create', {
            chat_name: name,
        }, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        });
    }

    public getChat(chatID: string)
    {
        return this.http.get<{
            id: string;
            name: string;
            owner: string;
        }>(`/api/chat/id/${chatID}`);
    }

    /** Updates {@link chats$}. */
    public updateChats()
    {
        this.auth.getUser().subscribe((user) =>
        {
            if (user === null) throw new Error('user is null');

            // todo: merge active and own chats
            this.chats$.next(user.active_chats);
        });
    }
}
