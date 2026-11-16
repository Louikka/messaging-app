import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Logger } from '../../lib/logger';
import { ServiceChats } from '../service-chats';
import { ServiceModal } from '../service-modal';


@Component({
    selector: 'app-chat-join-form',
    templateUrl: './chat-join-form.html',
    styleUrl: './chat-join-form.css',
    imports: [ AsyncPipe, ReactiveFormsModule ],
})
export class ChatJoinForm
{
    private readonly modal = inject(ServiceModal);

    public close()
    {
        this.modal.hideModal();
    }


    private readonly router = inject(Router);
    private readonly chats = inject(ServiceChats);

    public form = new FormGroup({
        chatId: new FormControl('', [ Validators.required ]),
    });

    public errlogs = new Logger();

    public onSubmit()
    {
        if (this.form.controls.chatId.invalid)
        {
            this.errlogs.new('Please, provide valid chat ID.');
            return;
        }

        // TODO

        // this.chats.addNewChat(this.form.value.chatName!).subscribe((chat) =>
        // {
        //     if (chat === null)
        //     {
        //         this.errlogs.new('Could not add new chat: unexpected error occured.');
        //     }
        //     else
        //     {
        //         this.errlogs.clear();
        //         this.close();
        //         this.router.navigate([ 'c', chat.id ]);
        //     }
        // });
    }
}
