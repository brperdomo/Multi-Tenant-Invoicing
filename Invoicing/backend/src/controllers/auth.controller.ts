import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export const login = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check if user is organization
    let result = await pool.query(
      'SELECT id, name, email, password_hash FROM organizations WHERE email = $1',
      [email]
    );

    let user = result.rows[0];
    let role: 'organization' | 'facility' = 'organization';

    // If not found in organizations, check facilities
    if (!user) {
      result = await pool.query(
        'SELECT id, name, email, password_hash FROM facilities WHERE email = $1',
        [email]
      );
      user = result.rows[0];
      role = 'facility';
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      role,
      email: user.email,
    });

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, ip_address) VALUES ($1, $2, $3, $4, $5)',
      [user.id, role, 'login', role, req.ip]
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const table = req.user.role === 'organization' ? 'organizations' : 'facilities';
    const result = await pool.query(
      `SELECT id, name, email, created_at FROM ${table} WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        ...result.rows[0],
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
