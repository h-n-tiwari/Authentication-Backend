import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

export interface JwtPayload {
  id: string | number;
}

// GENERATE TOKEN
export const generateToken = (id: string | number) => {

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign({ id }, secret, {
    expiresIn: "30d",
  });
};

// VERIFY TOKEN
export const verifyToken = (token: string): JwtPayload => {
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.verify(token, secret) as JwtPayload;
};
