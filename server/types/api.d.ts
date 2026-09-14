export interface POSTLogin extends UserCredentials {
    //
}

export interface POSTLoginResponse {
    token: string;
}


export interface POSTChatCreate {
    /** Name of the chat. */
    name: string;
}


export interface POSTChatMessages {
    message: string;
}
