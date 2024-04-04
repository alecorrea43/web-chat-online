const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const Register = require("../../src/Pages/register");

const app = express();
app.use(cors());
 
const port = process.env.PORT || 5000;
const router = express.Router();


router.post("/register", (req, res) => {
res.json(Register.handleRegister(req));
});

app.use("/.netlify/functions/server", router);
export const handler = serverless(app);