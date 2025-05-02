const express = require('express');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { isStudentRegistered } = require('../utils/web3');
const router = express.Router();

// Register student
router.post('/register', async (req, res) => {
  try {
    const { name, email, registrationId, password, ethereumAddress } = req.body;
    
    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [
        { email },
        { registrationId },
        { ethereumAddress }
      ] 
    });
    
    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student already exists with this email, registration ID, or Ethereum address' 
      });
    }
    
    // Create new student
    const student = new Student({
      name,
      email,
      registrationId,
      password,
      ethereumAddress,
      // Check if the student is already registered on blockchain
      isRegistered: await isStudentRegistered(registrationId)
    });
    
    await student.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        registrationId: student.registrationId,
        ethereumAddress: student.ethereumAddress,
        isRegistered: student.isRegistered,
        isAdmin: student.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering student',
      error: error.message
    });
  }
});

// Login student
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find student by email
    const student = await Student.findOne({ email });
    
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    const isMatch = await student.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        registrationId: student.registrationId,
        ethereumAddress: student.ethereumAddress,
        isRegistered: student.isRegistered,
        isAdmin: student.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

module.exports = router;