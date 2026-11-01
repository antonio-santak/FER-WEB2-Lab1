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


/*

// Primjeri

await callPostAPI("Ivan Horvat","HR-12345").catch(error => console.log(error));
await callPostAPI("Jan Burić","HR-12345").catch(error => console.log(error));
await callPostAPI("Petar Veliki","HR-65432").catch(error => console.log(error));
await callPostAPI("Ivan Horvat","HR-98765").catch(error => console.log(error));
await callPostAPI("Petar Veliki","HR-34567").catch(error => console.log(error));
await callPostAPI("Matea Miočić","HR-65432").catch(error => console.log(error));
await callPostAPI("Ana Horvat","HR-12345").catch(error => console.log(error));
await callPostAPI("Ilija Vrić","HR-98765").catch(error => console.log(error));
await callPostAPI("Filip Edna","HR-34567").catch(error => console.log(error));
await callPostAPI("Đurđica Pačić","HR-12345").catch(error => console.log(error));

// await callGetAPI("[ID PROPUSNICE]").catch(error => console.log(error));

*/