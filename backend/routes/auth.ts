import express from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import type { CookieOptions } from "express";

// INTERNAL IMPORT

import pool from "../config/db";
import errorResponse from "../utils/errorResponse";
import { generateToken } from "../utils/jwt";
import { protect } from "../middleware/auth";


const router = express.Router();

const saltRounds = 10;

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// REGISTER

router.post("/register", async (req: Request, res: Response) => {
  try {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Please provide all required fields" });
    }

    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userExist.rows.length > 0) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword],
    );

    const token = generateToken(newUser.rows[0].id);

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({ user: newUser.rows[0] });
  } catch (err) {
    console.error("Registration error:", err);

    return errorResponse(res);
  }
});

// LOGIN

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Please provide all required fields" });
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ msg: "Invalid Credentials " });
    }

    const userData = user.rows[0];

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials " });
    }

    const token = generateToken(userData.id);

    res.cookie("token", token, cookieOptions);

    return res.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return errorResponse(res);
  }
});

// ME

router.get('/me', protect, async (req: Request, res: Response) => {
  res.json(req.user)
  // return info of the logged in user from protect middleware

});

// LOGOUT

router.post('/logout', (req: Request, res: Response) => {
  res.cookie('token', "", { ...cookieOptions, maxAge: 1 });
  res.json({ msg: 'Logged out successfully' });
});

export default router;
