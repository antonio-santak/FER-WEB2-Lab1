import { getToken, issuePass } from "./automat.ts";
import "dotenv/config";

export async function callGetAPI(id : string){
    const token = await getToken(
        process.env.ISSUER_BASE_URL ?? "", 
        process.env.AUTH0_AUDIENCE ?? "", 
        process.env.AUTH0_CLIENT_ID ?? "", 
        process.env.AUTH0_CLIENT_SECRET ?? "", 
        "read:passes");

    const response = await fetch(`http://localhost:3000/passes/${id}`,{
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if(!response.ok){
        throw new Error("Neuspješan dohvat propusnice! "+response.status);
    }

    const data = await response.json();
    console.log(data);
}

export async function callPostAPI(name : string, document : string){
    const token = await getToken(
        process.env.ISSUER_BASE_URL ?? "", 
        process.env.AUTH0_AUDIENCE ?? "", 
        process.env.AUTH0_CLIENT_ID ?? "", 
        process.env.AUTH0_CLIENT_SECRET ?? "", 
        "create:passes");

    await issuePass("http://localhost:3000/passes", token, name, document);
}

// await callPostAPI("Ivan Horvat","HR-12345").catch(error => console.log(error));
// await callGetAPI("8e9b138f-bfc7-4c14-bb6a-0becf184f546").catch(error => console.log(error));