/**
 * Authentication Service
 * Business logic for authentication operations
 * Following Single Responsibility Principle
 */

import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';
import UserRepository from '../repositories/UserRepository.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Password does not meet requirements', errors);
    }
    
    return true;
  }

  /**
   * Login user
   */
  async login(email, password) {
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user with password
    const user = await this.userRepository.findByEmailWithPassword(email);
    
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    let isValidPassword = false;
    
    if (user.password_hash) {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } else if (user.password) {
      // Fallback for migration period
      isValidPassword = password === user.password;
    }

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user);

    // Return user info (without password)
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.must_change_password || false,
      },
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Get user with current password
    const user = await this.userRepository.findById(userId);
    const userWithPassword = await this.userRepository.findByEmailWithPassword(user.email);

    // Verify current password
    let isValidPassword = false;
    
    if (userWithPassword.password_hash) {
      isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password_hash);
    } else if (userWithPassword.password) {
      isValidPassword = currentPassword === userWithPassword.password;
    }

    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await this.userRepository.updatePassword(userId, passwordHash);

    return { message: 'Password changed successfully' };
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

export default new AuthService(UserRepository);

