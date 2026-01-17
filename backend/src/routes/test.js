const express = require('express');
const { getJobStats } = require('../queues');

const router = express.Router();

// Job Queue Status Endpoint (no authentication required)
router.get('/jobs/status', async (req, res) => {
  try {
    const stats = await getJobStats();
    res.json(stats);
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Failed to get job stats'
      }
    });
  }
});

module.exports = router;
