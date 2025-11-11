import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest, BillingPeriod } from '../types';
import { hashPassword } from '../utils/password';

export const createFacility = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can create facilities' });
      return;
    }

    const {
      name,
      email,
      password,
      contact_person,
      phone,
      address,
      billing_period,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Check if email already exists
    const existingFacility = await pool.query(
      'SELECT id FROM facilities WHERE email = $1',
      [email]
    );

    if (existingFacility.rows.length > 0) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO facilities
       (organization_id, name, email, password_hash, contact_person, phone, address, billing_period)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, contact_person, phone, address, billing_period, created_at`,
      [
        req.user.userId,
        name,
        email,
        passwordHash,
        contact_person,
        phone,
        address,
        billing_period || 'monthly',
      ]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, req.user.role, 'create_facility', 'facility', result.rows[0].id]
    );

    res.status(201).json({
      message: 'Facility created successfully',
      facility: result.rows[0],
    });
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllFacilities = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can view all facilities' });
      return;
    }

    const result = await pool.query(
      `SELECT id, name, email, contact_person, phone, address, billing_period, created_at
       FROM facilities
       WHERE organization_id = $1
       ORDER BY name ASC`,
      [req.user.userId]
    );

    res.json({
      facilities: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFacilityById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    let query: string;
    let params: any[];

    if (req.user.role === 'organization') {
      query = `SELECT id, name, email, contact_person, phone, address, billing_period, created_at
               FROM facilities
               WHERE id = $1 AND organization_id = $2`;
      params = [id, req.user.userId];
    } else {
      // Facilities can only view their own info
      query = `SELECT id, name, email, contact_person, phone, address, billing_period, created_at
               FROM facilities
               WHERE id = $1 AND id = $2`;
      params = [id, req.user.userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }

    res.json({ facility: result.rows[0] });
  } catch (error) {
    console.error('Get facility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFacility = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can update facilities' });
      return;
    }

    const { id } = req.params;
    const { name, contact_person, phone, address, billing_period } = req.body;

    const result = await pool.query(
      `UPDATE facilities
       SET name = COALESCE($1, name),
           contact_person = COALESCE($2, contact_person),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           billing_period = COALESCE($5, billing_period)
       WHERE id = $6 AND organization_id = $7
       RETURNING id, name, email, contact_person, phone, address, billing_period, updated_at`,
      [name, contact_person, phone, address, billing_period, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, req.user.role, 'update_facility', 'facility', id]
    );

    res.json({
      message: 'Facility updated successfully',
      facility: result.rows[0],
    });
  } catch (error) {
    console.error('Update facility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFacility = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can delete facilities' });
      return;
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM facilities WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, req.user.role, 'delete_facility', 'facility', id]
    );

    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Delete facility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
