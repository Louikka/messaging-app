import type { DBChat, DBChatMessage } from './server/lib/db';


export namespace API {

    namespace register {
        namespace get {}
        namespace post {
            namespace req {
                interface body {
                    username: string;
                    password: string;
                }
            }
            namespace res {
                interface body {
                    token: string;
                }
            }
        }
    }

    namespace login {
        namespace get {}
        namespace post {
            namespace req {
                interface body {
                    username: string;
                    password: string;
                }
            }
            namespace res {
                interface body {
                    token: string;
                }
            }
        }
    }

    namespace user {
        namespace get {
            namespace req {}
            namespace res {
                interface body {
                    username: string;
                    active_chats: Array<string>;
                    own_chats: Array<string>;
                }
            }
        }
        namespace post {}
    }

    namespace chat {
        namespace get {
            namespace req {}
            namespace res {
                interface body extends DBChat {}
            }
        }
        namespace post {
            namespace req {
                interface body {
                    chat_name: string;
                }
            }
            namespace res {
                type body = string;
            }
        }

        namespace messages {
            namespace get {
                namespace req {}
                namespace res {}
            }
            namespace post {
                namespace req {
                    interface body {
                        message: string;
                    }
                }
                namespace res {}
            }
        }
    }
}
