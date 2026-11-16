import { Routes } from '@angular/router';

import { loginGuard } from './login-guard';
import { chatsResolver } from './chats-resolver';

import { Login } from './login/login';
import { Register } from './register/register';
import { ChatsRoom } from './chats-room/chats-room';
import { ChatsRoomChat } from './chats-room-chat/chats-room-chat';


export const routes: Routes = [
    {
        path: '',
        component: ChatsRoom,
        canActivate: [
            loginGuard,
        ],
        children: [
            {
                path: 'c/:chatId',
                component: ChatsRoomChat,
                resolve: {
                    chat: chatsResolver,
                },
            },
        ],
    },
    {
        path: 'login',
        component: Login,
    },
    {
        path: 'register',
        component: Register,
    },
];
