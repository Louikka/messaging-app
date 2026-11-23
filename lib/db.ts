import * as fs from 'node:fs';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { hashS, uuid } from './crypto.ts';


export interface DBUser {
    username: string;
    /** Encoded. */
    password: string;
    salt: string;
    /** ID's of chats. */
    active_chats: Array<string>;
    /** ID's of user's own chats. */
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
    message: string;
    timestamp: number;
}


export interface APIUser {
    username: string;
    chats: Array<DBChat>;
}


/** `SQLITE_CONSTRAINT_FOREIGNKEY` from SQLite's result codes. */
const SQLITE_CONSTRAINT_FOREIGNKEY = 787;

const SCHEMA = `
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        salt     TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS chats (
        seq   INTEGER PRIMARY KEY AUTOINCREMENT,
        id    TEXT NOT NULL UNIQUE,
        name  TEXT NOT NULL,
        owner TEXT NOT NULL REFERENCES users (username) ON UPDATE CASCADE
    ) STRICT;

    CREATE TABLE IF NOT EXISTS chat_members (
        username TEXT NOT NULL REFERENCES users (username) ON UPDATE CASCADE ON DELETE CASCADE,
        chat_id  TEXT NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
        is_owner INTEGER NOT NULL DEFAULT 0 CHECK (is_owner IN (0, 1)),
        PRIMARY KEY (username, chat_id)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS messages (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id   TEXT NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
        username  TEXT NOT NULL,
        message   TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id, id);
    CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON chat_members (chat_id);
    CREATE INDEX IF NOT EXISTS idx_chats_owner ON chats (owner);
`;


export class DBClient
{
    /**
     * @param dbPath Path to the SQLite database file. Defaults to the
     * `DB_PATH` environment variable or `./data.db`.
     */
    constructor(dbPath = process.env['DB_PATH'] ?? './data.db')
    {
        if (dbPath !== ':memory:')
        {
            fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        }

        this.db = new DatabaseSync(dbPath);

        this.db.exec('PRAGMA journal_mode = WAL;');
        this.db.exec('PRAGMA foreign_keys = ON;');
        this.db.exec('PRAGMA busy_timeout = 5000;');
        this.db.exec(SCHEMA);
    }


    public readonly db: DatabaseSync;


    /// User

    public async isUserExists(username: string): Promise<boolean>
    {
        const row = this.db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
        return row !== undefined;
    }

    public async addNewUser(username: string, password: string)
    {
        const hashedPassword = hashS(password);

        this.db.prepare(
            'INSERT INTO users (username, password, salt) VALUES (?, ?, ?)'
        ).run(username, hashedPassword.hash, hashedPassword.salt);
    }

    public async getUser(username: string): Promise<DBUser | null>
    {
        try
        {
            const user = this.db.prepare(
                'SELECT username, password, salt FROM users WHERE username = ?'
            ).get(username) as { username: string; password: string; salt: string; } | undefined;

            if (user === undefined)
            {
                return null;
            }

            const memberships = this.db.prepare(`
                SELECT m.chat_id, m.is_owner
                FROM chat_members AS m
                JOIN chats AS c ON c.id = m.chat_id
                WHERE m.username = ?
                ORDER BY c.seq
            `).all(username);

            const active_chats: string[] = [];
            const own_chats: string[] = [];
            for (const membership of memberships)
            {
                const chatId = membership['chat_id'] as string;
                active_chats.push(chatId);
                if (membership['is_owner'] === 1)
                {
                    own_chats.push(chatId);
                }
            }

            return {
                username: user.username,
                password: user.password,
                salt: user.salt,
                active_chats,
                own_chats,
            };
        }
        catch (err)
        {
            console.error(err);
            return null;
        }
    }

    public async getUserAPI(username: string): Promise<APIUser | null>
    {
        if (!await this.isUserExists(username))
        {
            return null;
        }

        const rows = this.db.prepare(`
            SELECT c.id, c.name, c.owner
            FROM chat_members AS m
            JOIN chats AS c ON c.id = m.chat_id
            WHERE m.username = ?
            ORDER BY c.seq
        `).all(username);

        return {
            username,
            chats: rows.map((row) => ({
                id: row['id'] as string,
                name: row['name'] as string,
                owner: row['owner'] as string,
            })),
        };
    }

    /**
     * @returns `-1` if an error occured, `0` otherwise.
     */
    public async updateUser(username: string, field: keyof DBUser, value: any): Promise<number>
    {
        if (!await this.isUserExists(username))
        {
            console.error(`Unable to update field "${field}" of the user "${username}": no such user exists.`);
            return -1;
        }

        try
        {
            this.transaction(() =>
            {
                switch (field)
                {
                    case 'username':
                    {
                        this.db.prepare('UPDATE users SET username = ? WHERE username = ?').run(String(value), username);
                        break;
                    }
                    case 'password':
                    {
                        this.db.prepare('UPDATE users SET password = ? WHERE username = ?').run(String(value), username);
                        break;
                    }
                    case 'salt':
                    {
                        this.db.prepare('UPDATE users SET salt = ? WHERE username = ?').run(String(value), username);
                        break;
                    }
                    case 'active_chats':
                    {
                        this.setActiveChats(username, this.parseChatIds(value));
                        break;
                    }
                    case 'own_chats':
                    {
                        this.setOwnChats(username, this.parseChatIds(value));
                        break;
                    }
                }
            });

            return 0;
        }
        catch (err)
        {
            console.error(err);
            return -1;
        }
    }

    /** Checks if user has specified chat ID in `active_chats`. */
    public async isUserInChat(username: string, chatID: string): Promise<boolean>
    {
        const row = this.db.prepare(
            'SELECT 1 FROM chat_members WHERE username = ? AND chat_id = ?'
        ).get(username, chatID);
        return row !== undefined;
    }


    /// Chats

    public async isChatExists(chatId: string): Promise<boolean>
    {
        const row = this.db.prepare('SELECT 1 FROM chats WHERE id = ?').get(chatId);
        return row !== undefined;
    }

    /**
     * @param name name of the chat.
     * @returns generated chat id (or `null` if error).
     */
    public async addNewChat(name: string, owner: string): Promise<string | null>
    {
        if (!await this.isUserExists(owner))
        {
            console.warn(`User "${owner}" does not exists.`);
            return null;
        }

        const chatId = uuid();

        try
        {
            this.transaction(() =>
            {
                this.db.prepare(
                    'INSERT INTO chats (id, name, owner) VALUES (?, ?, ?)'
                ).run(chatId, name, owner);
                this.db.prepare(
                    'INSERT INTO chat_members (username, chat_id, is_owner) VALUES (?, ?, 1)'
                ).run(owner, chatId);
            });
        }
        catch (err)
        {
            console.error(err);
            return null;
        }

        console.debug('Successfully added new chat: ', chatId, name);

        return chatId;
    }

    public async getChat(chatId: string): Promise<DBChat | null>
    {
        try
        {
            const chat = this.db.prepare(
                'SELECT id, name, owner FROM chats WHERE id = ?'
            ).get(chatId) as { id: string; name: string; owner: string; } | undefined;

            if (chat === undefined)
            {
                console.debug(`Unable to get chat "${chatId}".`);
                return null;
            }

            return {
                id: chat.id,
                name: chat.name,
                owner: chat.owner,
            };
        }
        catch (err)
        {
            console.error(err);
            return null;
        }
    }

    public async addChatMessage(chatId: string, message: DBChatMessage)
    {
        try
        {
            this.db.prepare(
                'INSERT INTO messages (chat_id, username, message, timestamp) VALUES (?, ?, ?, ?)'
            ).run(chatId, message.username, message.message, message.timestamp);
        }
        catch (err)
        {
            if ((err as { errcode?: number; }).errcode === SQLITE_CONSTRAINT_FOREIGNKEY)
            {
                console.debug(`Unable to add a message: chat "${chatId}" does not exist.`);
            }
            else
            {
                console.error(err);
            }
        }
    }

    public async getChatMessages(chatId: string): Promise<DBChatMessage[] | null>
    {
        if (!await this.isChatExists(chatId))
        {
            console.debug(`Unable to get chat "${chatId}".`);
            return null;
        }

        try
        {
            const rows = this.db.prepare(
                'SELECT username, message, timestamp FROM messages WHERE chat_id = ? ORDER BY id'
            ).all(chatId);

            return rows.map((row) => ({
                username: row['username'] as string,
                message: row['message'] as string,
                timestamp: row['timestamp'] as number,
            }));
        }
        catch (err)
        {
            console.error(err);
            return null;
        }
    }


    /// Helpers

    private transaction(fn: () => void)
    {
        this.db.exec('BEGIN');

        try
        {
            fn();
            this.db.exec('COMMIT');
        }
        catch (err)
        {
            this.db.exec('ROLLBACK');
            throw err;
        }
    }

    private parseChatIds(value: unknown): string[]
    {
        const ids = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(ids))
        {
            throw new TypeError('Expected an array of chat IDs.');
        }

        return ids.map(String);
    }

    private setActiveChats(username: string, chatIds: string[])
    {
        if (chatIds.length === 0)
        {
            this.db.prepare('DELETE FROM chat_members WHERE username = ?').run(username);
            return;
        }

        const placeholders = chatIds.map(() => '?').join(', ');
        this.db.prepare(
            `DELETE FROM chat_members WHERE username = ? AND chat_id NOT IN (${placeholders})`
        ).run(username, ...chatIds);

        for (const chatId of chatIds)
        {
            this.db.prepare(
                'INSERT OR IGNORE INTO chat_members (username, chat_id, is_owner) VALUES (?, ?, 0)'
            ).run(username, chatId);
        }
    }

    private setOwnChats(username: string, chatIds: string[])
    {
        this.db.prepare('UPDATE chat_members SET is_owner = 0 WHERE username = ?').run(username);

        for (const chatId of chatIds)
        {
            this.db.prepare(`
                INSERT INTO chat_members (username, chat_id, is_owner) VALUES (?, ?, 1)
                ON CONFLICT (username, chat_id) DO UPDATE SET is_owner = 1
            `).run(username, chatId);
        }
    }
}
