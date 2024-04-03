import cors from "cors";
import express, { Application } from "express";
import "dotenv/config";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientsEvents } from './types';

const PORT = process.env.PORT || 8000;
const app: Application = express();

app.use(cors());

const expressServer = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

const io = new Server<ClientToServerEvents, ServerToClientsEvents>(expressServer, {
    cors: {
        origin: [process.env.CLIENT_URL || "http://localhost:3000"],
        methods: ["GET", "POST"],
    },
});

app.get("*", (_, res) => {
    res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
});
