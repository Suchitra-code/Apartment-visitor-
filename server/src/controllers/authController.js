const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Flat = require('../models/Flat');
const ActivityLog = require('../models/ActivityLog');
const { asyncHandler, sendResponse } = require('../utils/response');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'apartmenthub_default_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a resident
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, flatId, block, flatNumber, residentType } = req.body;

  if (!email || !password) {
    return sendResponse(res, 400, false, 'Email and password are required.');
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendResponse(res, 400, false, 'Please provide a valid email address.');
  }

  if (password.length < 6) {
    return sendResponse(res, 400, false, 'Password must be at least 6 characters long.');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return sendResponse(res, 400, false, 'An account with this email address already exists.');
  }

  let assignedFlat = flatId;
  if (!assignedFlat && block && flatNumber) {
    let foundFlat = await Flat.findOne({ block: block.toUpperCase(), number: flatNumber.toUpperCase() });
    if (!foundFlat) {
      foundFlat = await Flat.create({
        block: block.toUpperCase(),
        floor: parseInt(flatNumber.charAt(0)) || 1,
        number: flatNumber.toUpperCase(),
        status: 'occupied',
      });
    }
    assignedFlat = foundFlat._id;
  }

  // If user didn't specify flat, default to any available or create default flat
  if (!assignedFlat) {
    let defaultFlat = await Flat.findOne();
    if (!defaultFlat) {
      defaultFlat = await Flat.create({
        block: 'A',
        floor: 1,
        number: '101',
        status: 'occupied',
      });
    }
    assignedFlat = defaultFlat._id;
  }

  const displayName = name && name.trim() ? name.trim() : email.split('@')[0];
  const userPhone = phone && phone.trim() ? phone.trim() : '+1 000-000-0000';

  const user = await User.create({
    name: displayName,
    email: email.toLowerCase().trim(),
    phone: userPhone,
    password,
    role: 'resident',
    flat: assignedFlat,
    residentType: residentType || 'owner',
    status: 'approved', // Automatically approved so newly created user can log in immediately
  });

  if (assignedFlat) {
    await Flat.findByIdAndUpdate(assignedFlat, {
      $addToSet: { residents: user._id },
      status: 'occupied',
    });
  }

  await ActivityLog.create({
    user: user._id,
    action: 'REGISTER_SUCCESS',
    module: 'auth',
    details: `User registered with email ${user.email}`,
  });

  return sendResponse(res, 201, true, 'Account registered successfully! You can now log in.', {
    id: user._id,
    name: user.name,
    email: user.email,
    status: user.status,
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendResponse(res, 400, false, 'Please provide both email and password.');
  }

  const user = await User.findOne({ email }).select('+password').populate('flat');
  if (!user) {
    return sendResponse(res, 401, false, 'Invalid email or password.');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return sendResponse(res, 401, false, 'Invalid email or password.');
  }

  if (user.status === 'pending') {
    return sendResponse(
      res,
      403,
      false,
      'Your account is pending Society Manager approval. You will receive access once approved.'
    );
  }

  if (user.status === 'rejected') {
    return sendResponse(
      res,
      403,
      false,
      'Your account request has been rejected. Please visit the Society Admin Office.'
    );
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  // Set HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  });

  await ActivityLog.create({
    user: user._id,
    action: 'LOGIN_SUCCESS',
    module: 'auth',
    details: `User logged in as ${user.role}`,
  });

  const userData = user.toObject();
  delete userData.password;

  return sendResponse(res, 200, true, 'Logged in successfully', {
    token,
    user: userData,
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('flat');
  return sendResponse(res, 200, true, 'User profile fetched', user);
});

// @desc    Update current user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, familyMembersCount, vehicles } = req.body;

  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (familyMembersCount !== undefined) user.familyMembersCount = familyMembersCount;
  if (vehicles) user.vehicles = vehicles;

  if (req.file) {
    user.avatar = `/uploads/${req.file.filename}`;
  }

  await user.save();
  const updated = await User.findById(user._id).populate('flat');

  return sendResponse(res, 200, true, 'Profile updated successfully', updated);
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return sendResponse(res, 400, false, 'Current password does not match.');
  }

  user.password = newPassword;
  await user.save();

  return sendResponse(res, 200, true, 'Password changed successfully');
});

// @desc    Forgot password (Demo flow generates token)
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return sendResponse(res, 404, false, 'No account found with this email address.');
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  console.log(`[PASSWORD RESET DEV DEMO] Email: ${email} | Token: ${resetToken}`);

  return sendResponse(res, 200, true, 'Reset token generated (check console/dev mode).', {
    demoResetToken: resetToken,
    instructions: 'In production this is sent via email. For demo, token is included above.',
  });
});

// @desc    Reset password using token
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return sendResponse(res, 400, false, 'Invalid or expired reset token.');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return sendResponse(res, 200, true, 'Password successfully reset. You can now login.');
});

// @desc    Logout
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return sendResponse(res, 200, true, 'Logged out successfully');
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
};
