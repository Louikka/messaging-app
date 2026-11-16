import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ServiceChats } from '../service-chats';
import { AsyncPipe } from '@angular/common';
import { ServiceModal } from '../service-modal';
import { ChatCreateForm } from '../chat-create-form/chat-create-form';
import { ChatJoinForm } from '../chat-join-form/chat-join-form';


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

    private readonly modal = inject(ServiceModal);
    public readonly chats = inject(ServiceChats);


    public navigateToCreateChat()
    {
        this.modal.showModal(ChatCreateForm);
    }

    public navigateToJoinChat()
    {
        this.modal.showModal(ChatJoinForm);
    }

    public navigateToChat(chatId: string)
    {
        this.router.navigate([ 'c', chatId ]);
    }
}
