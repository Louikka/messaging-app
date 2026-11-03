import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ServiceChats } from '../service-chats';
import { AsyncPipe } from '@angular/common';


@Component({
    selector: 'app-chats-room',
    templateUrl: './chats-room.html',
    styleUrl: './chats-room.css',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ RouterOutlet, AsyncPipe ],
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
        this.router.navigate([ '/create' ]);
    }

    public navigateToJoinChat()
    {
        this.router.navigate([ '/join' ]);
    }

    public navigateToChat(chatId: string)
    {
        this.router.navigate([ `/c/${chatId}` ]);
    }
}
