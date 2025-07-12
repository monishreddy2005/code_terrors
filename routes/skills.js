const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/database');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Get all skills
router.get('/', async (req, res) => {
  try {
    const { category, search, approved } = req.query;
    
    let sql = 'SELECT * FROM skills WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      sql += ` AND skill_category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      sql += ` AND (skill_name ILIKE $${paramCount} OR skill_description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (approved !== undefined) {
      paramCount++;
      sql += ` AND is_approved = $${paramCount}`;
      params.push(approved === 'true');
    }

    sql += ' ORDER BY skill_name';

    const result = await query(sql, params);
    res.json({ skills: result.rows });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get skill by ID
router.get('/:skillId', async (req, res) => {
  try {
    const { skillId } = req.params;

    const result = await query(
      'SELECT * FROM skills WHERE skill_id = $1',
      [skillId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ skill: result.rows[0] });
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new skill (admin only)
router.post('/', verifyToken, [
  body('skill_name').trim().isLength({ min: 2 }).withMessage('Skill name must be at least 2 characters'),
  body('skill_category').optional().trim(),
  body('skill_description').optional().trim(),
  body('is_approved').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skill_name, skill_category, skill_description, is_approved = false } = req.body;

    // Check if skill already exists
    const existingSkill = await query(
      'SELECT skill_id FROM skills WHERE LOWER(skill_name) = LOWER($1)',
      [skill_name]
    );

    if (existingSkill.rows.length > 0) {
      return res.status(400).json({ error: 'Skill with this name already exists' });
    }

    // Insert new skill
    const result = await query(
      'INSERT INTO skills (skill_name, skill_category, skill_description, is_approved) VALUES ($1, $2, $3, $4) RETURNING *',
      [skill_name, skill_category, skill_description, is_approved]
    );

    res.status(201).json({ skill: result.rows[0] });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update skill (admin only)
router.put('/:skillId', verifyToken, [
  body('skill_name').optional().trim().isLength({ min: 2 }).withMessage('Skill name must be at least 2 characters'),
  body('skill_category').optional().trim(),
  body('skill_description').optional().trim(),
  body('is_approved').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skillId } = req.params;
    const { skill_name, skill_category, skill_description, is_approved } = req.body;

    // Check if skill exists
    const existingSkill = await query(
      'SELECT skill_id FROM skills WHERE skill_id = $1',
      [skillId]
    );

    if (existingSkill.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (skill_name !== undefined) {
      paramCount++;
      updates.push(`skill_name = $${paramCount}`);
      params.push(skill_name);
    }

    if (skill_category !== undefined) {
      paramCount++;
      updates.push(`skill_category = $${paramCount}`);
      params.push(skill_category);
    }

    if (skill_description !== undefined) {
      paramCount++;
      updates.push(`skill_description = $${paramCount}`);
      params.push(skill_description);
    }

    if (is_approved !== undefined) {
      paramCount++;
      updates.push(`is_approved = $${paramCount}`);
      params.push(is_approved);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(skillId);

    const sql = `UPDATE skills SET ${updates.join(', ')} WHERE skill_id = $${paramCount} RETURNING *`;
    const result = await query(sql, params);

    res.json({ skill: result.rows[0] });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete skill (admin only)
router.delete('/:skillId', verifyToken, async (req, res) => {
  try {
    const { skillId } = req.params;

    // Check if skill exists
    const existingSkill = await query(
      'SELECT skill_id FROM skills WHERE skill_id = $1',
      [skillId]
    );

    if (existingSkill.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Delete skill (this will cascade to user_skills_offered and user_skills_wanted)
    await query('DELETE FROM skills WHERE skill_id = $1', [skillId]);

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get skill categories
router.get('/categories/list', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT skill_category FROM skills WHERE skill_category IS NOT NULL ORDER BY skill_category'
    );

    const categories = result.rows.map(row => row.skill_category);
    res.json({ categories });
  } catch (error) {
    console.error('Get skill categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get skills by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const result = await query(
      'SELECT * FROM skills WHERE skill_category = $1 AND is_approved = true ORDER BY skill_name',
      [category]
    );

    res.json({ skills: result.rows });
  } catch (error) {
    console.error('Get skills by category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 