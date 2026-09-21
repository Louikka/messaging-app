import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ServiceChats } from '../service-chats';
import { AsyncPipe } from '@angular/common';


@Component({
    selector: 'app-chats-room',
    imports: [ RouterOutlet, AsyncPipe ],
    templateUrl: './chats-room.html',
    styleUrl: './chats-room.css',
})
export class ChatsRoom
{
    constructor()
    {
        this.chats.updateChats();
    }


    private readonly router = inject(Router);
    public readonly chats = inject(ServiceChats);


    public navigateToCreateChat()
    {
        this.router.navigate([ '/chatsRoom/create' ]);
    }

    public navigateToJoinChat()
    {
        this.router.navigate([ '/chatsRoom/join' ]);
    }

    public navigateToChat(chatId: string)
    {
        this.router.navigate([ 'chatsRoom', chatId ]);
    }
}
