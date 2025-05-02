const express = require('express');
const Student = require('../models/Student');
const { verifyToken, isAdmin } = require('../middlewares/auth');
const { registerStudentOnBlockchain, isStudentRegistered } = require('../utils/web3');
const router = express.Router();

// Get all students (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const students = await Student.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// Get student profile (current user)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.student._id).select('-password');
    
    // Update blockchain registration status
    const isRegistered = await isStudentRegistered(student.registrationId);
    
    if (isRegistered !== student.isRegistered) {
      student.isRegistered = isRegistered;
      await student.save();
    }
    
    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student profile',
      error: error.message
    });
  }
});

// Register student on blockchain (admin only)
router.post('/register-blockchain', verifyToken, isAdmin, async (req, res) => {
  try {
    const { registrationId } = req.body;
    
    // Find student by registration ID
    const student = await Student.findOne({ registrationId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if already registered on blockchain
    if (student.isRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Student is already registered on blockchain'
      });
    }
    
    // Register on blockchain
    const result = await registerStudentOnBlockchain(
      student.registrationId,
      student.ethereumAddress
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error registering student on blockchain',
        error: result.error
      });
    }
    
    // Update student record
    student.isRegistered = true;
    await student.save();
    
    res.status(200).json({
      success: true,
      message: 'Student registered on blockchain successfully',
      transactionHash: result.transactionHash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering student on blockchain',
      error: error.message
    });
  }
});

// Bulk register students on blockchain (admin only)
router.post('/register-blockchain-bulk', verifyToken, isAdmin, async (req, res) => {
  try {
    const { registrationIds } = req.body;
    
    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of registration IDs'
      });
    }
    
    const results = [];
    
    // Process each registration ID
    for (const registrationId of registrationIds) {
      const student = await Student.findOne({ registrationId });
      
      if (!student) {
        results.push({
          registrationId,
          success: false,
          message: 'Student not found'
        });
        continue;
      }
      
      if (student.isRegistered) {
        results.push({
          registrationId,
          success: false,
          message: 'Already registered on blockchain'
        });
        continue;
      }
      
      const result = await registerStudentOnBlockchain(
        student.registrationId,
        student.ethereumAddress
      );
      
      if (result.success) {
        student.isRegistered = true;
        await student.save();
        
        results.push({
          registrationId,
          success: true,
          message: 'Registered successfully',
          transactionHash: result.transactionHash
        });
      } else {
        results.push({
          registrationId,
          success: false,
          message: 'Registration failed',
          error: result.error
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Bulk registration process completed',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing bulk registration',
      error: error.message
    });
  }
});

module.exports = router;