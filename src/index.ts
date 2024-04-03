import cors from "cors";
import express, { Application } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 8000;
const app: Application = express();

app.use(cors());

const expressServer = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

app.get("*", (_, res) => {
    res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
});
