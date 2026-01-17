const { Merchant } = require('../models');

const authenticate = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const apiSecret = req.headers['x-api-secret'];
  
  if (!apiKey || !apiSecret) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        description: 'Missing API credentials'
      }
    });
  }
  
  try {
    const merchant = await Merchant.findOne({ where: { apiKey } });
    
    if (!merchant || merchant.apiSecret !== apiSecret) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          description: 'Invalid API credentials'
        }
      });
    }
    
    req.merchant = merchant;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        description: 'Authentication failed'
      }
    });
  }
};

module.exports = authenticate;
