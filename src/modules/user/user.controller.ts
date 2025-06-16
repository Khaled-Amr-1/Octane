import { Request, Response } from 'express';
import { getAllUsersFromDB } from './user.service.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersFromDB();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
};