import type { Request, Response, NextFunction } from 'express';

export function requireScope(requiredScope: string){
    return (req: Request, res: Response, next: NextFunction) => {
        let scopes: string[] = [];
        if(req.auth){
            if(typeof req.auth.payload.scope === "string"){
                scopes = req.auth.payload.scope.split(" ");
            }
        }

        if(!scopes.includes(requiredScope)){
            return res.status(403).send("Neispravna dozvola!");
        }

        next();
    };
}