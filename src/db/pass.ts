import { pool } from "./pool.ts";

export async function countPasses(){
    const result = await pool.query("SELECT COUNT(*) AS count FROM pass");
    return result.rows[0].count ?? 0;
}

export async function countActivePasses(){
    const result = await pool.query("SELECT COUNT(*) AS count FROM pass WHERE status = 'ACTIVE' OR status = 'active'");
    return result.rows[0].count ?? 0;
}

export async function getPass(id : string){
    const result = await pool.query("SELECT * FROM pass WHERE id = $1", [id]);
    return result.rows[0] ?? {};
}

export async function getAllPasses(){
    const result = await pool.query("SELECT * FROM pass");
    return result.rows ?? [];
}

export async function deactivePass(id : string){
    const result = await pool.query("UPDATE pass SET status = 'CANCELLED' WHERE id = $1", [id]);
    return result.rowCount ?? 0;
}

export async function deletePass(id : string){
    const result = await pool.query("DELETE FROM pass WHERE id = $1", [id]);
    return result.rowCount ?? 0;
}

export async function insertPass(pass : {id : string, name : string, document : string, issuedAt: string, status : string}){
    const result = await pool.query("INSERT INTO pass (id, name, document, issued_at, status) VALUES ($1,$2,$3,$4,$5)", [pass.id, pass.name, pass.document, pass.issuedAt, pass.status]);
    return result.rowCount ?? 0;
}