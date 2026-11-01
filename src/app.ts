import express, { Request, Response } from "express";
import oidc from "express-openid-connect";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import "dotenv/config";
import { auth } from "express-oauth2-jwt-bearer";
import { countPasses, countActivePasses, getPass, getAllPasses, deactivePass, deletePass, insertPass } from "./db/pass.ts";
import { requireScope } from "./middleware/requireScope.ts";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
const { requiresAuth } = oidc;

// config

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3000;
const baseURL = externalUrl || `http://localhost:${port}`;
const config = {
    baseURL: baseURL
}
const hostname = externalUrl ? '0.0.0.0': '127.0.0.1';

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, 'views'));

app.use(
    oidc.auth({
        authRequired: false,
        auth0Logout: true,
        idpLogout: true,
        secret: process.env.AUTH_SECRET,
        baseURL: process.env.NODE_ENV === 'development' ? `http://localhost:${port}` : config.baseURL,
        clientID: process.env.AUTH_CLIENT_ID,
        issuerBaseURL: process.env.ISSUER_BASE_URL
    })
);

const checkToken = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.ISSUER_BASE_URL
})

// routes

app.get("/login", (req : Request, res : Response) => {
    res.oidc.login({
        returnTo: "/",
        authorizationParams: { screen_hint: "signup" }
    })
});

app.get("/logout", (req: Request, res: Response) => {
    res.oidc.logout({
        returnTo: "/"
    })
})

app.get("/", async (req : Request, res: Response) => {
    if(req.oidc.isAuthenticated()){
        res.locals.signedIn = true;
        res.locals.user = req.oidc.user;

        try{
            const totalPasses = await countPasses();
            res.locals.totalPasses = totalPasses;

            const activePasses = await countActivePasses();
            res.locals.activePasses = activePasses;

            const passes = await getAllPasses();
            res.locals.passes = passes;
        }
        catch(error){
            console.error(error);
            res.status(500).send("DB Error");
        }
    }
    else{
        res.locals.signedIn = false;
        res.locals.user = null;

        try{
            const totalPasses = await countPasses();
            res.locals.totalPasses = totalPasses;

            const activePasses = await countActivePasses();
            res.locals.activePasses = activePasses;
        }
        catch(error){
            console.error(error);
            res.status(500).send("DB Error");
        }
    }

    return res.render("index");
});

app.get("/pass/:id", async (req : Request, res : Response) => {
    try{
        const id : string = String(req.params.id); 

        const pass = await getPass(id);
        if(pass.id === id){
            return res.render("pass", { pass });
        }

        return res.status(404).send("Nepostojeća propusnica!");
    }
    catch(error){
        console.error(error);
        res.status(500).send("DB Error");
    }
});

app.post("/pass/:id/cancel", requiresAuth(), async (req: Request, res: Response) => {
    try{
        const id : string = String(req.params.id);

        const result = await deactivePass(id);
        if(result != 0){
            return res.redirect("/");
        }

        return res.status(404).send("Nepostojeća propusnica!");
    }
    catch(error){
        console.error(error);
        res.status(500).send("DB Error");
    }
});

app.post("/pass/:id/delete", requiresAuth(), async (req: Request, res: Response) => {
    try{
        const id : string = String(req.params.id);

        const result = await deletePass(id);
        if(result != 0){
            return res.redirect("/");
        }

        return res.status(404).send("Nepostojeća propusnica!");
    }
    catch(error){
        console.error(error);
        res.status(500).send("DB Error");
    }
});

// two special API points

app.get("/passes/:id", checkToken, requireScope("read:passes"), async (req : Request, res : Response) => {
    try{
        const id : string = String(req.params.id);

        const pass = await getPass(id);
        if(pass.id === id){
            return res.send({
                id: pass.id,
                name: pass.name,
                document: pass.document,
                issuedAt: pass.issued_at,
                status: pass.status
            });
        }

        return res.status(404).send("Nepostojeća propusnica!");
    }
    catch(error){
        console.error(error);
        return res.status(500).send("DB Error");
    }
});

app.post("/passes", checkToken, requireScope("create:passes"), async (req : Request, res : Response) => {
    const { name, document } = req.body;
    if((name === null || name === undefined) || (document === null || document === undefined)){
        return res.status(400).send("Neispravan zahtjev!");
    }

    const id = randomUUID();
    const issuedAt = new Date().toISOString();

    try{
        const result = await insertPass({id, name, document, issuedAt, status: 'ACTIVE'});
        if(result == 0) throw new Error("Neuspješan unos podataka za propusnicu!");

        res.location(`/passes/${id}`);
        
        const qrcodeBuffer = await QRCode.toBuffer(
            `${config.baseURL}/pass/${id}`,
            { type: "png" }
        );

        return res.status(201).type("png").send(qrcodeBuffer);
    }
    catch(error){
        console.error(error);
        return res.status(500).send("DB Error");
    }
});

// 

// running

app.listen(port, hostname, () =>{
    console.log(`Server locally running at http://${hostname}:${port}`);
    if(externalUrl) console.log(`External URL: ${externalUrl}`);
});