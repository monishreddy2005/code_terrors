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

// Get all swappers (public profiles)
router.get('/swappers', async (req, res) => {
  try {
    const { user_name, skill_search, skill_category, location } = req.query;

    // Use the database function to get swappers
    const result = await query(
      'SELECT * FROM get_swappers($1, $2, $3, $4)',
      [user_name || null, skill_search || null, skill_category || null, location || null]
    );

    res.json({ swappers: result.rows });
  } catch (error) {
    console.error('Get swappers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile by ID
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT 
        u.user_id, u.name, u.email, u.location, u.location_type, 
        u.availability_type, u.about, u.rating, u.created_at,
        u.is_public, u.show_location, u.show_email
      FROM users u 
      WHERE u.user_id = $1 AND u.is_banned = FALSE`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get user's offered skills
    const offeredSkillsResult = await query(
      `SELECT s.skill_id, s.skill_name, s.skill_category, s.skill_description
       FROM user_skills_offered uso
       JOIN skills s ON s.skill_id = uso.skill_id
       WHERE uso.user_id = $1`,
      [userId]
    );

    // Get user's wanted skills
    const wantedSkillsResult = await query(
      `SELECT s.skill_id, s.skill_name, s.skill_category, s.skill_description
       FROM user_skills_wanted usw
       JOIN skills s ON s.skill_id = usw.skill_id
       WHERE usw.user_id = $1`,
      [userId]
    );

    res.json({
      user: {
        ...user,
        offered_skills: offeredSkillsResult.rows,
        wanted_skills: wantedSkillsResult.rows
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', verifyToken, [
  body('about').optional().trim(),
  body('is_public').optional().isBoolean(),
  body('show_location').optional().isBoolean(),
  body('show_email').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { about, is_public, show_location, show_email } = req.body;

    // Use the database function to update profile
    await query(
      'SELECT update_about_and_privacy($1, $2, $3, $4, $5)',
      [req.user.userId, about || '', is_public, show_location, show_email]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user availability
router.put('/availability', verifyToken, [
  body('availability_type').isIn(['weekends', 'weekdays', 'evenings', 'flexible']).withMessage('Invalid availability type'),
  body('location_type').optional().isIn(['remote', 'local']).withMessage('Location type must be remote or local'),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { availability_type, location_type, location } = req.body;

    // Use the database function to update availability
    await query(
      'SELECT update_availability($1, $2, $3, $4)',
      [req.user.userId, availability_type, location_type, location]
    );

    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add skill offered
router.post('/skills/offered', verifyToken, [
  body('skill_id').isInt().withMessage('Skill ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skill_id } = req.body;

    // Use the database function to add skill offered
    await query(
      'SELECT add_skill_offered($1, $2)',
      [req.user.userId, skill_id]
    );

    res.json({ message: 'Skill offered added successfully' });
  } catch (error) {
    console.error('Add skill offered error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add skill wanted
router.post('/skills/wanted', verifyToken, [
  body('skill_id').isInt().withMessage('Skill ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skill_id } = req.body;

    // Use the database function to add skill wanted
    await query(
      'SELECT add_skill_wanted($1, $2)',
      [req.user.userId, skill_id]
    );

    res.json({ message: 'Skill wanted added successfully' });
  } catch (error) {
    console.error('Add skill wanted error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove skill offered
router.delete('/skills/offered/:skillId', verifyToken, async (req, res) => {
  try {
    const { skillId } = req.params;

    // Use the database function to remove skill offered
    await query(
      'SELECT remove_skill_offered($1, $2)',
      [req.user.userId, skillId]
    );

    res.json({ message: 'Skill offered removed successfully' });
  } catch (error) {
    console.error('Remove skill offered error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove skill wanted
router.delete('/skills/wanted/:skillId', verifyToken, async (req, res) => {
  try {
    const { skillId } = req.params;

    // Use the database function to remove skill wanted
    await query(
      'SELECT remove_skill_wanted($1, $2)',
      [req.user.userId, skillId]
    );

    res.json({ message: 'Skill wanted removed successfully' });
  } catch (error) {
    console.error('Remove skill wanted error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 