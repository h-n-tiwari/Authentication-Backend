import type { Request, Response, NextFunction } from "express";

// INTERNAL IMPOERT

import pool from "../config/db";
import { verifyToken } from "../utils/jwt";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ msg: "Not authorized, no token" });
    };

    const decoded = verifyToken(token);

    const user = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [decoded.id]);

    if (user.rows.length === 0) {
      return res.status(401).json({ msg: "Not authorized, user not found" });
    };

    req.user = user.rows[0];
    next();

  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: "Not authorized, token failed" });
  }
}
