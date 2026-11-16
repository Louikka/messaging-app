import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ServiceModal } from '../service-modal';
import { ServiceChats } from '../service-chats';
import { CustomValidators } from '../../lib/custom-validators';
import { Logger } from '../../lib/logger';


@Component({
    selector: 'app-chat-create-form',
    templateUrl: './chat-create-form.html',
    styleUrl: './chat-create-form.css',
    imports: [ AsyncPipe, ReactiveFormsModule ],
})
export class ChatCreateForm
{
    private readonly modal = inject(ServiceModal);

    public close()
    {
        this.modal.hideModal();
    }


    private readonly router = inject(Router);
    private readonly chats = inject(ServiceChats);

    public form = new FormGroup({
        chatName: new FormControl('', [ Validators.required, CustomValidators.nonEmpty ]),
    });

    public errlogs = new Logger();

    public onSubmit()
    {
        if (this.form.controls.chatName.invalid)
        {
            this.errlogs.new('Please, provide valid chat name.');
            return;
        }

        this.chats.addNewChat(this.form.value.chatName!).subscribe((chat) =>
        {
            if (chat === null)
            {
                this.errlogs.new('Could not add new chat: unexpected error occured.');
            }
            else
            {
                this.errlogs.clear();
                this.close();
                this.router.navigate([ 'c', chat.id ]);
            }
        });
    }
}
