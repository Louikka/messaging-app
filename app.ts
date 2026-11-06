import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import express from 'express';
import jwt from 'jsonwebtoken';
import { expressjwt, type Request as JWTRequest } from 'express-jwt';

import { RedisClient, type DBChatMessage } from './lib/db.ts';
import { validateSaltedHash } from './lib/crypto.ts';
import {
    getEnvKey,
    isNonEmptyString,
    verifyUserRegisterCredentials
} from './lib/lib.ts';


process.loadEnvFile('./.env');

const SERVER_PORT = getEnvKey('SERVER_PORT');
const WSS_PORT = +getEnvKey('WSS_PORT');
const JWT_PRIVATE_KEY = getEnvKey('JWT_PRIVATE_KEY');

// directory where angular dumps built bundle (`ng build`)
const STATIC_DIR = path.resolve('./frontend/dist/frontend/browser');

const JWTMiddleware = expressjwt({ secret: JWT_PRIVATE_KEY, algorithms: [ 'HS256' ] });



/* Database ******************************************************************/

const db = new RedisClient();
await db.connect();



/* Initialize WebSocket ******************************************************/

const wss = new WebSocketServer({ port: WSS_PORT });
console.debug(`Created WebSocketServer on port :${WSS_PORT}.`);

wss.on('connection', (ws) =>
{
    console.debug(`WebSocket connection established.`);

    ws.on('error', (err) =>
    {
        console.error('WebSocketServer error : ', err);
    });

    ws.on('message', (data) =>
    {
        console.debug('WebSocketServer received some data...');
    });

    ws.on('close', (code, reason) =>
    {
        console.debug(`WebSocket connection closed (${code}).`);
    });
});



/* Express.js routing ********************************************************/

const app = express();

app.use(express.json());
app.use('/api', JWTMiddleware.unless({ path: [ '/api/register', '/api/login' ] }));

app.use('/', express.static(STATIC_DIR));



app.get('/', (req, res) =>
{
    res.send('Hello, world!');
});


app.post('/api/register', async (req, res) =>
{
    const { username, password } = req.body;
    if (!isNonEmptyString(username) || !isNonEmptyString(password))
    {
        res.status(400).send({ error: 'Cannot get user credentials.' });
        return;
    }

    if (!verifyUserRegisterCredentials(username, password))
    {
        res.status(401).send({ error: 'Provided credentials are not valid.' });
        return;
    }

    if (await db.isUserExists(username))
    {
        res.status(409).send({ error: 'Such user already exists.' });
        return;
    }

    await db.addNewUser(username, password);

    res.json({
        token: jwt.sign({ username }, JWT_PRIVATE_KEY),
    });
});

app.post('/api/login', async (req, res) =>
{
    const { username, password } = req.body;
    if (!isNonEmptyString(username) || !isNonEmptyString(password))
    {
        res.status(400).send({ error: 'Cannot get user credentials.' });
        return;
    }

    const user = await db.getUser(username);
    if (user === null || !validateSaltedHash(password, user.password, user.salt))
    {
        res.status(401).send({ error: 'User does not exists or credentials are wrong.' });
        return;
    }

    res.json({
        token: jwt.sign({ username }, JWT_PRIVATE_KEY),
    });
});


app.get('/api/user', async (req: JWTRequest, res) =>
{
    const username = req.auth?.['username'];
    if (!isNonEmptyString(username))
    {
        res.sendStatus(400);
        return;
    }

    const user = await db.getUserAPI(username);
    if (user === null)
    {
        res.status(401).send({ error: 'User does not exists or credentials are wrong.' });
        return;
    }

    res.json({
        username: user.username,
        chats: user.chats,
    });
});


app.post('/api/chat/create', async (req: JWTRequest, res) =>
{
    const owner = req.auth?.['username'];
    if (!isNonEmptyString(owner))
    {
        res.sendStatus(400);
        return;
    }

    const { chat_name } = req.body;
    if (!isNonEmptyString(chat_name))
    {
        res.status(400).send({ error: 'Cannot get `chat_name`.' });
        return;
    }

    const chatID = await db.addNewChat(chat_name, owner);
    if (chatID === null)
    {
        res.status(400).send({ error: 'Unable to create new chat.' });
        return;
    }

    res.json({
        id: chatID,
        name: chat_name,
        owner,
    });
});

// TODO
// app.post('/api/chat/join', async (req: JWTRequest, res) =>
// {
//     const owner = req.auth?.['username'];
//     if (!isNonEmptyString(owner))
//     {
//         res.sendStatus(400);
//         return;
//     }

//     const { chat_id } = req.body;
//     if (!isNonEmptyString(chat_id))
//     {
//         res.status(400).send({ error: 'Cannot get `chat_id`.' });
//         return;
//     }

//     res.sendStatus(204); // can use PUT instead of POST mayhaps?
// });


app.get('/api/chat/id/:chat_id/messages', async (req: JWTRequest, res) =>
{
    const username = req.auth?.['username'];
    if (!isNonEmptyString(username))
    {
        res.sendStatus(400);
        return;
    }

    const chatID = req.params['chat_id'];
    if (!isNonEmptyString(chatID))
    {
        res.sendStatus(400);
        return;
    }

    if (!await db.isUserInChat(username, chatID))
    {
        res.status(403).send({ error: 'Access denied.' });
        return;
    }

    const chatMessages = await db.getChatMessages(chatID);
    if (chatMessages === null)
    {
        res.status(404).send({ error: `Chat with ID "${chatID}" was not found.` });
        return;
    }

    res.json(chatMessages);
});

app.post('/api/chat/id/:chat_id/messages', async (req: JWTRequest, res) =>
{
    const username = req.auth?.['username'];
    if (!isNonEmptyString(username))
    {
        res.sendStatus(400);
        return;
    }

    const chatID = req.params['chat_id'];
    if (!isNonEmptyString(chatID))
    {
        res.sendStatus(400);
        return;
    }

    if (!await db.isUserInChat(username, chatID))
    {
        res.status(403).send({ error: 'Access denied.' });
        return;
    }

    const userChatMessage = {
        username,
        text: req.body.message,
        timestamp: Date.now(),
    } as DBChatMessage;

    // send messages through websocket
    for (const ws of wss.clients)
    {
        if (ws.readyState == ws.OPEN)
        {
            ws.send(JSON.stringify(userChatMessage));
        }
    }

    db.addChatMessage(chatID, userChatMessage);

    res.sendStatus(204);
});



/* HTTP server ***************************************************************/

const server = http.createServer(app);

server.on('upgrade', (request: http.IncomingMessage & { user: string | jwt.JwtPayload }, socket, head) =>
{
    try
    {
        // Extract URL query parameters
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token)
        {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_PRIVATE_KEY);
        request.user = decoded;

        // Complete the WebSocket handshake
        wss.handleUpgrade(request, socket, head, (ws) =>
        {
            wss.emit('connection', ws, request);
        });
    }
    catch (err)
    {
        console.error('Error while upgrading server:', err);
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
    }
});


server.listen(SERVER_PORT, () =>
{
    console.log(`Server up and running on http://localhost:${SERVER_PORT}/`);
});
