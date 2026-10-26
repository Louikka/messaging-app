interface UserCredentials {
    username: string;
    password: string;
}


interface DataUser {
    username: string;
    active_chats: Array<{
        id: string;
        name: string;
        /** User's name. */
        owner: string;
    }>;
    own_chats: Array<{
        id: string;
        name: string;
    }>;
}
