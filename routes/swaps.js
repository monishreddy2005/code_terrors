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

// Create a new swap request
router.post('/', verifyToken, [
  body('responder_id').isInt().withMessage('Responder ID must be a number'),
  body('skill_offered_id').isInt().withMessage('Skill offered ID must be a number'),
  body('skill_wanted_id').isInt().withMessage('Skill wanted ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { responder_id, skill_offered_id, skill_wanted_id } = req.body;
    const requester_id = req.user.userId;

    // Check if responder exists and is not banned
    const responderCheck = await query(
      'SELECT user_id FROM users WHERE user_id = $1 AND is_banned = FALSE',
      [responder_id]
    );

    if (responderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Responder not found or is banned' });
    }

    // Check if requester is not trying to swap with themselves
    if (requester_id === responder_id) {
      return res.status(400).json({ error: 'Cannot create swap request with yourself' });
    }

    // Check if skill_offered_id belongs to requester
    const offeredSkillCheck = await query(
      'SELECT user_skill_id FROM user_skills_offered WHERE user_skill_id = $1 AND user_id = $2',
      [skill_offered_id, requester_id]
    );

    if (offeredSkillCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Skill offered does not belong to you' });
    }

    // Check if skill_wanted_id belongs to responder
    const wantedSkillCheck = await query(
      'SELECT user_skill_id FROM user_skills_offered WHERE user_skill_id = $1 AND user_id = $2',
      [skill_wanted_id, responder_id]
    );

    if (wantedSkillCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Skill wanted does not belong to responder' });
    }

    // Check if there's already a pending swap request between these users
    const existingSwap = await query(
      'SELECT swap_id FROM swap_requests WHERE requester_id = $1 AND responder_id = $2 AND status = \'pending\'',
      [requester_id, responder_id]
    );

    if (existingSwap.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending swap request with this user' });
    }

    // Create the swap request
    const result = await query(
      'INSERT INTO swap_requests (requester_id, responder_id, skill_offered_id, skill_wanted_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [requester_id, responder_id, skill_offered_id, skill_wanted_id]
    );

    res.status(201).json({ 
      message: 'Swap request created successfully',
      swap: result.rows[0]
    });

  } catch (error) {
    console.error('Create swap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's swap requests (as requester or responder)
router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    let sql = `
      SELECT 
        sr.*,
        requester.name as requester_name,
        responder.name as responder_name,
        skill_offered.skill_name as skill_offered_name,
        skill_wanted.skill_name as skill_wanted_name
      FROM swap_requests sr
      JOIN users requester ON requester.user_id = sr.requester_id
      JOIN users responder ON responder.user_id = sr.responder_id
      JOIN user_skills_offered uso_offered ON uso_offered.user_skill_id = sr.skill_offered_id
      JOIN skills skill_offered ON skill_offered.skill_id = uso_offered.skill_id
      JOIN user_skills_offered uso_wanted ON uso_wanted.user_skill_id = sr.skill_wanted_id
      JOIN skills skill_wanted ON skill_wanted.skill_id = uso_wanted.skill_id
      WHERE sr.requester_id = $1 OR sr.responder_id = $1
    `;
    const params = [userId];

    if (status) {
      sql += ' AND sr.status = $2';
      params.push(status);
    }

    sql += ' ORDER BY sr.created_at DESC';

    const result = await query(sql, params);

    res.json({ swaps: result.rows });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get swap request by ID
router.get('/:swapId', verifyToken, async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        sr.*,
        requester.name as requester_name,
        responder.name as responder_name,
        skill_offered.skill_name as skill_offered_name,
        skill_wanted.skill_name as skill_wanted_name
      FROM swap_requests sr
      JOIN users requester ON requester.user_id = sr.requester_id
      JOIN users responder ON responder.user_id = sr.responder_id
      JOIN user_skills_offered uso_offered ON uso_offered.user_skill_id = sr.skill_offered_id
      JOIN skills skill_offered ON skill_offered.skill_id = uso_offered.skill_id
      JOIN user_skills_offered uso_wanted ON uso_wanted.user_skill_id = sr.skill_wanted_id
      JOIN skills skill_wanted ON skill_wanted.skill_id = uso_wanted.skill_id
      WHERE sr.swap_id = $1 AND (sr.requester_id = $2 OR sr.responder_id = $2)`,
      [swapId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found' });
    }

    res.json({ swap: result.rows[0] });
  } catch (error) {
    console.error('Get swap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept swap request
router.put('/:swapId/accept', verifyToken, async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user.userId;

    // Check if swap request exists and user is the responder
    const swapCheck = await query(
      'SELECT * FROM swap_requests WHERE swap_id = $1 AND responder_id = $2 AND status = \'pending\'',
      [swapId, userId]
    );

    if (swapCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found or you are not authorized to accept it' });
    }

    // Update swap status to accepted
    await query(
      'UPDATE swap_requests SET status = \'accepted\', updated_at = CURRENT_TIMESTAMP WHERE swap_id = $1',
      [swapId]
    );

    res.json({ message: 'Swap request accepted successfully' });
  } catch (error) {
    console.error('Accept swap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject swap request
router.put('/:swapId/reject', verifyToken, async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user.userId;

    // Check if swap request exists and user is the responder
    const swapCheck = await query(
      'SELECT * FROM swap_requests WHERE swap_id = $1 AND responder_id = $2 AND status = \'pending\'',
      [swapId, userId]
    );

    if (swapCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found or you are not authorized to reject it' });
    }

    // Update swap status to rejected
    await query(
      'UPDATE swap_requests SET status = \'rejected\', updated_at = CURRENT_TIMESTAMP WHERE swap_id = $1',
      [swapId]
    );

    res.json({ message: 'Swap request rejected successfully' });
  } catch (error) {
    console.error('Reject swap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel swap request
router.put('/:swapId/cancel', verifyToken, async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user.userId;

    // Check if swap request exists and user is the requester
    const swapCheck = await query(
      'SELECT * FROM swap_requests WHERE swap_id = $1 AND requester_id = $2 AND status = \'pending\'',
      [swapId, userId]
    );

    if (swapCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found or you are not authorized to cancel it' });
    }

    // Update swap status to cancelled
    await query(
      'UPDATE swap_requests SET status = \'cancelled\', updated_at = CURRENT_TIMESTAMP WHERE swap_id = $1',
      [swapId]
    );

    res.json({ message: 'Swap request cancelled successfully' });
  } catch (error) {
    console.error('Cancel swap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rate a completed swap
router.post('/:swapId/rate', verifyToken, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { swapId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user.userId;

    // Check if swap request exists and is completed
    const swapCheck = await query(
      'SELECT * FROM swap_requests WHERE swap_id = $1 AND (requester_id = $2 OR responder_id = $2) AND status = \'accepted\'',
      [swapId, userId]
    );

    if (swapCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Swap request not found or not completed' });
    }

    const swap = swapCheck.rows[0];
    const ratedUserId = swap.requester_id === userId ? swap.responder_id : swap.requester_id;

    // Check if user has already rated this swap
    const existingRating = await query(
      'SELECT rating_id FROM user_ratings WHERE swap_id = $1 AND rater_user_id = $2',
      [swapId, userId]
    );

    if (existingRating.rows.length > 0) {
      return res.status(400).json({ error: 'You have already rated this swap' });
    }

    // Create rating
    await query(
      'INSERT INTO user_ratings (rated_user_id, rater_user_id, swap_id, rating, feedback) VALUES ($1, $2, $3, $4, $5)',
      [ratedUserId, userId, swapId, rating, feedback]
    );

    // Update user's average rating
    await query(
      `UPDATE users 
       SET rating = (
         SELECT AVG(rating)::NUMERIC(2,1) 
         FROM user_ratings 
         WHERE rated_user_id = $1
       )
       WHERE user_id = $1`,
      [ratedUserId]
    );

    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rate swap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 