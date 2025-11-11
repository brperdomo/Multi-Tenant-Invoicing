import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest, InvoiceStatus, BillingPeriod } from '../types';
import fs from 'fs';
import path from 'path';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export const createInvoice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can create invoices' });
      return;
    }

    const {
      facility_id,
      invoice_number,
      amount,
      due_date,
      billing_period,
      period_start,
      period_end,
      notes,
    } = req.body;

    if (!facility_id || !invoice_number || !amount || !due_date || !billing_period || !period_start || !period_end) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if invoice number already exists
    const existingInvoice = await pool.query(
      'SELECT id FROM invoices WHERE invoice_number = $1',
      [invoice_number]
    );

    if (existingInvoice.rows.length > 0) {
      res.status(400).json({ error: 'Invoice number already exists' });
      return;
    }

    // Get facility details for PDF generation
    const facilityResult = await pool.query(
      'SELECT id, name, address FROM facilities WHERE id = $1 AND organization_id = $2',
      [facility_id, req.user.userId]
    );

    if (facilityResult.rows.length === 0) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }

    const facility = facilityResult.rows[0];
    const attachmentPath = req.file ? req.file.path : null;

    // Generate PDF invoice
    const pdfDir = './uploads/invoices/generated';
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const pdfFileName = `invoice-${invoice_number.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);

    await generateInvoicePDF(
      {
        invoice_number,
        facility_name: facility.name,
        facility_address: facility.address,
        amount,
        due_date,
        billing_period,
        period_start,
        period_end,
        notes,
        created_at: new Date().toISOString(),
      },
      pdfPath
    );

    const result = await pool.query(
      `INSERT INTO invoices
       (organization_id, facility_id, invoice_number, amount, due_date, billing_period, period_start, period_end, file_path, generated_pdf_path, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user.userId,
        facility_id,
        invoice_number,
        amount,
        due_date,
        billing_period,
        period_start,
        period_end,
        attachmentPath,
        pdfPath,
        notes,
        'pending',
      ]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.userId, req.user.role, 'create_invoice', 'invoice', result.rows[0].id, JSON.stringify({ invoice_number, amount, facility_id })]
    );

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: result.rows[0],
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllInvoices = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { status, facility_id } = req.query;

    let query: string;
    let params: any[];

    if (req.user.role === 'organization') {
      query = `
        SELECT i.*, f.name as facility_name
        FROM invoices i
        JOIN facilities f ON i.facility_id = f.id
        WHERE i.organization_id = $1
      `;
      params = [req.user.userId];

      if (status) {
        query += ` AND i.status = $${params.length + 1}`;
        params.push(status);
      }

      if (facility_id) {
        query += ` AND i.facility_id = $${params.length + 1}`;
        params.push(facility_id);
      }
    } else {
      // Facilities can only see their own invoices
      query = `
        SELECT i.*, o.name as organization_name
        FROM invoices i
        JOIN organizations o ON i.organization_id = o.id
        WHERE i.facility_id = $1
      `;
      params = [req.user.userId];

      if (status) {
        query += ` AND i.status = $${params.length + 1}`;
        params.push(status);
      }
    }

    query += ' ORDER BY i.due_date DESC';

    const result = await pool.query(query, params);

    res.json({
      invoices: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInvoiceById = async (
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
        SELECT i.*, f.name as facility_name, f.email as facility_email
        FROM invoices i
        JOIN facilities f ON i.facility_id = f.id
        WHERE i.id = $1 AND i.organization_id = $2
      `;
      params = [id, req.user.userId];
    } else {
      query = `
        SELECT i.*, o.name as organization_name, o.email as organization_email
        FROM invoices i
        JOIN organizations o ON i.organization_id = o.id
        WHERE i.id = $1 AND i.facility_id = $2
      `;
      params = [id, req.user.userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Get payment proofs for this invoice
    const payments = await pool.query(
      'SELECT * FROM payment_proofs WHERE invoice_id = $1 ORDER BY uploaded_at DESC',
      [id]
    );

    res.json({
      invoice: result.rows[0],
      payment_proofs: payments.rows,
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateInvoiceStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can update invoice status' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const result = await pool.query(
      `UPDATE invoices
       SET status = $1
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [status, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.userId, req.user.role, 'update_invoice_status', 'invoice', id, JSON.stringify({ status })]
    );

    res.json({
      message: 'Invoice status updated successfully',
      invoice: result.rows[0],
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteInvoice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can delete invoices' });
      return;
    }

    const { id } = req.params;

    // Get invoice to delete associated file
    const invoice = await pool.query(
      'SELECT file_path FROM invoices WHERE id = $1 AND organization_id = $2',
      [id, req.user.userId]
    );

    if (invoice.rows.length === 0) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Delete file if exists
    if (invoice.rows[0].file_path && fs.existsSync(invoice.rows[0].file_path)) {
      fs.unlinkSync(invoice.rows[0].file_path);
    }

    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.userId, req.user.role, 'delete_invoice', 'invoice', id]
    );

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInvoiceStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: 'Only organizations can view statistics' });
      return;
    }

    const stats = await pool.query(
      `SELECT
         COUNT(*) as total_invoices,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
         COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputed_count,
         SUM(amount) as total_amount,
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
       FROM invoices
       WHERE organization_id = $1`,
      [req.user.userId]
    );

    const facilityStats = await pool.query(
      `SELECT
         f.id,
         f.name,
         COUNT(i.id) as invoice_count,
         COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paid_count,
         SUM(i.amount) as total_amount,
         SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) as paid_amount
       FROM facilities f
       LEFT JOIN invoices i ON f.id = i.facility_id
       WHERE f.organization_id = $1
       GROUP BY f.id, f.name
       ORDER BY f.name`,
      [req.user.userId]
    );

    res.json({
      overall: stats.rows[0],
      by_facility: facilityStats.rows,
    });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
