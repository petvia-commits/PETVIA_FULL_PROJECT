import jwt from "jsonwebtoken";

function secret(){
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

export function signJwt(payload){
  return jwt.sign(payload, secret(), { expiresIn: "7d" });
}

export function authRequired(req, res, next){
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok:false, error:"UNAUTHORIZED" });
  try{
    const decoded = jwt.verify(token, secret());
    req.user = decoded;
    return next();
  }catch{
    return res.status(401).json({ ok:false, error:"INVALID_TOKEN" });
  }
}

export function adminRequired(req, res, next){
  if (!req.user) return res.status(401).json({ ok:false, error:"UNAUTHORIZED" });
  if (req.user.role !== "admin") return res.status(403).json({ ok:false, error:"ADMIN_ONLY" });
  return next();
}
