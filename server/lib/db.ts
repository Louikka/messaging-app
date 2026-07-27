import crypto from 'crypto';
import redis from 'redis';
import { createHashFromString, hashPassword } from './lib.ts';


export interface DBUser {
    username: string;
    /** Encoded. */
    password: string;
    salt: string;
    /** ID's of chats. */
    active_chats: Array<string>;
    /** ID's of chats. */
    own_chats: Array<string>;
}

export interface DBChat {
    id: string;
    name: string;
    /** User's name. */
    owner: string;
}

export interface DBChatMessage {
    username: string;
    text: string;
    timestamp: number;
}


/**
 * @param name primal identifier for key (converts to upper case).
 * @param val value that will be hashed and concatenated to the key.
 * @returns string key of type `<name>:<hash>`; for example `ID:123`.
 */
function constructDBKey(name: string, val: string): string
{
    return name.toUpperCase() + ':' + createHashFromString(val);
}


export class RedisClient
{
    constructor()
    {
        this.client = redis.createClient();

        this.client.on('error', (err) =>
        {
            console.error('Redis client error: ', err);
        });
    }


    public readonly client;

    public async connect()
    {
        await this.client.connect();
    }


    public async isUserExists(username: string): Promise<boolean>
    {
        return await this.client.exists(constructDBKey('USER', username)) > 0;
    }

    public async addNewUser(username: string, password: string)
    {
        const userDBKey = constructDBKey('USER', username);
        const hashedPassword = hashPassword(password);

        await this.client.hSet(userDBKey, 'username', username);
        await this.client.hSet(userDBKey, 'password', hashedPassword.hash);
        await this.client.hSet(userDBKey, 'salt', hashedPassword.salt);
        await this.client.hSet(userDBKey, 'active_chats', '[]');
        await this.client.hSet(userDBKey, 'own_chats', '[]');

        console.debug('Successfully added new user: ', username);
    }

    public async getUser(username: string): Promise<DBUser | null>
    {
        if (await this.isUserExists(username))
        {
            try
            {
                const user = {} as DBUser;
                const dbUser = await this.client.hGetAll(constructDBKey('USER', username));
                for (const [key, value] of Object.entries(dbUser))
                {
                    switch (key)
                    {
                        case 'active_chats':
                        {
                            user.active_chats = JSON.parse(value);
                            break;
                        }
                        case 'own_chats':
                        {
                            user.own_chats = JSON.parse(value);
                            break;
                        }

                        default:
                        {
                            user[key as keyof Omit<DBUser, 'active_chats' | 'own_chats'>] = value;
                        }
                    }
                }

                return user;
            }
            catch (err)
            {
                console.error(err);
            }
        }
        else
        {
            console.debug(`Unable to get user "${username}".`);
        }

        return null;
    }

    /**
     * @returns `-1` if an error occured, `0` if field already existed and get updated, `1` if new field was created.
     */
    public async updateUser(username: string, field: keyof DBUser, value: any)
    {
        if (!await this.isUserExists(username))
        {
            console.error(`Unable to update field "${field}" of the user "${username}": no such user exists.`);
            return -1;
        }

        return await this.client.hSet(constructDBKey('USER', username), field, value);
    }


    public async isChatExists(chatId: string): Promise<boolean>
    {
        return await this.client.exists(constructDBKey('CHAT', chatId)) > 0;
    }

    /**
     * @param name name of the chat.
     * @returns generated chat id (or `null` if error).
     */
    public async addNewChat(name: string, owner: string): Promise<string | null>
    {
        const user = await this.getUser(owner);
        if (user === null)
        {
            console.warn(`User "${owner}" does not exists.`);
            return null;
        }

        const chatId = crypto.randomUUID();
        const chatDBKey = constructDBKey('CHAT', chatId);

        await this.client.hSet(chatDBKey, 'id', chatId);
        await this.client.hSet(chatDBKey, 'name', name);
        await this.client.hSet(chatDBKey, 'owner', owner);

        user.own_chats.push(chatId);
        user.active_chats.push(chatId);

        let ok = true;
        ok &&= await this.updateUser(owner, 'own_chats', JSON.stringify(user.own_chats)) >= 0;
        ok &&= await this.updateUser(owner, 'active_chats', JSON.stringify(user.active_chats)) >= 0;
        if (!ok) return null;

        console.debug('Successfully added new chat: ', chatId, name);

        return chatId;
    }

    public async getChat(chatId: string): Promise<DBChat | null>
    {
        if (await this.isChatExists(chatId))
        {
            try
            {
                const chat = {} as DBChat;
                const dbChat = await this.client.hGetAll(constructDBKey('CHAT', chatId));
                for (const [key, value] of Object.entries(dbChat))
                {
                    chat[key as keyof DBChat] = value;
                }

                return chat;
            }
            catch (err)
            {
                console.error(err);
            }
        }
        else
        {
            console.debug(`Unable to get chat "${chatId}".`);
        }

        return null;
    }

    public async addChatMessage(chatId: string, message: DBChatMessage)
    {
        if (await this.isChatExists(chatId))
        {
            try
            {
                await this.client.rPush(constructDBKey('CHAT', chatId) + ':MESSAGES', JSON.stringify(message));
            }
            catch (err)
            {
                console.error(err);
            }
        }
        else
        {
            console.debug(`Unable to get chat "${chatId}".`);
        }
    }

    public async getChatMessages(chatId: string): Promise<DBChatMessage[] | null>
    {
        if (await this.isChatExists(chatId))
        {
            try
            {
                const messages = [] as DBChatMessage[];
                const dbChatMessages = await this.client.lRange(constructDBKey('CHAT', chatId) + ':MESSAGES', 0, -1);
                for (const message of dbChatMessages)
                {
                    messages.push(JSON.parse(message));
                }

                return messages;
            }
            catch (err)
            {
                console.error(err);
            }
        }
        else
        {
            console.debug(`Unable to get chat "${chatId}".`);
        }

        return null;
    }
}
