import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "./auth.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }
  if (name.length <= 3) {
    res.status(400).json({ message: "Name must be more than 3 characters" });
    return;
  }
  if (password.length <= 6) {
    res
      .status(400)
      .json({ message: "Password must be more than 6 characters" });
    return;
  }
  const octaneEmailRegex = /^[a-zA-Z0-9._%+-]+@octane-tech\.io$/;
  if (!octaneEmailRegex.test(email)) {
    res
      .status(400)
      .json({ message: "Email must be in the form @octane-tech.io" });
    return;
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }
    const newUser = await createUser({ name, email, password }); // Should return the created user object
    // Generate JWT token for the newly created user
    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        image: newUser.image,
      },
      JWT_SECRET,
      { expiresIn: "168h" }
    );
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        image: newUser.image,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || user.password !== password) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (user.status === "suspended") {
      res
        .status(403)
        .json({ message: "Account suspended" });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.image,
      },
      JWT_SECRET,
      { expiresIn: "168h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.image,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
