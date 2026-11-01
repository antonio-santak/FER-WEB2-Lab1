import { writeFile } from "node:fs/promises";

export async function getToken(
    authority: string,
    audience: string,
    clientId: string,
    clientSecret: string,
    scope: string
): Promise<string> {
    try {
        const response = await fetch(`${authority}/oauth/token`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                "client_id": clientId,
                "client_secret": clientSecret,
                "audience": audience,
                "grant_type": "client_credentials",
                "scope": scope
            }),
        });

        if (!response.ok) {
            throw new Error("Pogreška prilikom dohvaćanja tokena!");
        }

        const data = await response.json();
        return data.access_token;

    } catch (error) {
        console.error(error);
        throw error;
    }
}


export async function issuePass(
  url: string,
  token: string,
  name: string,
  document: string
): Promise<void> {
    const response = await fetch(`${url}`,{
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name, document
        })
    });

    if(!response.ok){
        throw new Error("Neuspješan rezultat pristupne točke! "+response.status);
    }

    const location: string | null = response.headers.get("location");

    if(location == null) throw new Error("Nepostojeće zaglavlje Location!");

    const location_tokens = location.split("/");
    const id = location_tokens[location_tokens.length-1];

    try{
        const qrcodeBuffer : Buffer = Buffer.from(await response.arrayBuffer());
        await writeFile(`./${id}.png`, qrcodeBuffer);
    }
    catch(error){
        console.error(error);
        throw new Error("Pogreška prilikom izdavanja propusnice: "+error);
    }
}