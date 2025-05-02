const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id);
    
    if (!student) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authentication token' 
      });
    }
    
    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Middleware to check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.student.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Admin verification failed',
      error: error.message
    });
  }
};

// Middleware to check if student is registered on blockchain
exports.isRegisteredOnBlockchain = async (req, res, next) => {
  try {
    if (!req.student.isRegistered) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is not yet registered on the blockchain. Please contact an administrator.' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Blockchain registration verification failed',
      error: error.message
    });
  }
};