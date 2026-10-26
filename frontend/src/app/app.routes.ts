import { Routes } from '@angular/router';
import { loginGuard } from './login-guard';
import { chatsResolver } from './chats-resolver';

import { Home } from './home/home';
import { Register } from './register/register';
import { Login } from './login/login';
import { ChatsRoom } from './chats-room/chats-room';
import { ChatsRoomCreate } from './chats-room-create/chats-room-create';
import { ChatsRoomJoin } from './chats-room-join/chats-room-join';
import { ChatsRoomChat } from './chats-room-chat/chats-room-chat';


export const routes: Routes = [
    {
        path: '',
        component: Home,
    },
    {
        path: 'register',
        component: Register,
    },
    {
        path: 'login',
        component: Login,
    },
    {
        path: 'chatsRoom',
        component: ChatsRoom,
        canActivate: [
            loginGuard,
        ],
        children: [
            {
                path: 'create',
                component: ChatsRoomCreate,
            },
            {
                path: 'join',
                component: ChatsRoomJoin,
            },
            {
                path: ':chatId',
                component: ChatsRoomChat,
                resolve: {
                    chat: chatsResolver,
                },
            },
        ],
    },
];
