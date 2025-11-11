import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../types';
import fs from 'fs';

export const uploadPaymentProof = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'facility') {
      res.status(403).json({ error: 'Only facilities can upload payment proofs' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { invoice_id, payment_date, payment_method, reference_number, notes } = req.body;

    if (!invoice_id || !payment_date) {
      res.status(400).json({ error: 'Invoice ID and payment date are required' });
      return;
    }

    // Check if invoice belongs to this facility
    const invoice = await pool.query(
      'SELECT id, status FROM invoices WHERE id = $1 AND facility_id = $2',
      [invoice_id, req.user.userId]
    );

    if (invoice.rows.length === 0) {
      // Delete uploaded file if invoice not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO payment_proofs
       (invoice_id, facility_id, file_path, payment_date, payment_method, reference_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        invoice_id,
        req.user.userId,
        req.file.path,
        payment_date,
        payment_method,
        reference_number,
        notes,
      ]
    );

    // Update invoice status to paid (optional - organization may want to verify first)
    // await pool.query(
    //   'UPDATE invoices SET status = $1 WHERE id = $2',
    //   ['paid', invoice_id]
    // );

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.userId, req.user.role, 'upload_payment_proof', 'payment_proof', result.rows[0].id, JSON.stringify({ invoice_id })]
    );

    res.status(201).json({
      message: 'Payment proof uploaded successfully',
      payment_proof: result.rows[0],
    });
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPaymentProofs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { invoice_id } = req.params;

    let query: string;
    let params: any[];

    if (req.user.role === 'organization') {
      // Organization can see payment proofs for their invoices
      query = `
        SELECT pp.*, i.invoice_number, f.name as facility_name
        FROM payment_proofs pp
        JOIN invoices i ON pp.invoice_id = i.id
        JOIN facilities f ON pp.facility_id = f.id
        WHERE i.id = $1 AND i.organization_id = $2
        ORDER BY pp.uploaded_at DESC
      `;
      params = [invoice_id, req.user.userId];
    } else {
      // Facility can only see their own payment proofs
      query = `
        SELECT pp.*, i.invoice_number
        FROM payment_proofs pp
        JOIN invoices i ON pp.invoice_id = i.id
        WHERE i.id = $1 AND pp.facility_id = $2
        ORDER BY pp.uploaded_at DESC
      `;
      params = [invoice_id, req.user.userId];
    }

    const result = await pool.query(query, params);

    res.json({
      payment_proofs: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get payment proofs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllPaymentProofs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can view all payment proofs' });
      return;
    }

    const result = await pool.query(
      `SELECT pp.*, i.invoice_number, i.amount, f.name as facility_name
       FROM payment_proofs pp
       JOIN invoices i ON pp.invoice_id = i.id
       JOIN facilities f ON pp.facility_id = f.id
       WHERE i.organization_id = $1
       ORDER BY pp.uploaded_at DESC`,
      [req.user.userId]
    );

    res.json({
      payment_proofs: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get all payment proofs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePaymentProof = async (
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
      query = `
        DELETE FROM payment_proofs pp
        USING invoices i
        WHERE pp.id = $1 AND pp.invoice_id = i.id AND i.organization_id = $2
        RETURNING pp.file_path
      `;
      params = [id, req.user.userId];
    } else {
      query = `
        DELETE FROM payment_proofs
        WHERE id = $1 AND facility_id = $2
        RETURNING file_path
      `;
      params = [id, req.user.userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Payment proof not found' });
      return;
    }

    // Delete file
    if (result.rows[0].file_path && fs.existsSync(result.rows[0].file_path)) {
      fs.unlinkSync(result.rows[0].file_path);
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, req.user.role, 'delete_payment_proof', 'payment_proof', id]
    );

    res.json({ message: 'Payment proof deleted successfully' });
  } catch (error) {
    console.error('Delete payment proof error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
