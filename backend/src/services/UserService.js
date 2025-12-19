/**
 * UserService
 * Business logic for user operations
 */

import UserRepository from '../repositories/UserRepository.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

class UserService {
  /**
   * Get all users (without password hashes)
   */
  async getAllUsers() {
    return await UserRepository.findAllSafe();
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role) {
    return await UserRepository.findByRole(role);
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    // Validate user data
    this.validateUserData(userData);

    // Check if user with same email already exists
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const userToCreate = {
      ...userData,
      passwordHash,
      mustChangePassword: userData.mustChangePassword !== undefined ? userData.mustChangePassword : true
    };

    // Remove plain password from object
    delete userToCreate.password;

    const user = await UserRepository.create(userToCreate);
    
    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update a user
   */
  async updateUser(id, userData) {
    // Check if user exists
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // If email is being updated, check for conflicts
    if (userData.email && userData.email !== existingUser.email) {
      const emailConflict = await UserRepository.findByEmail(userData.email);
      if (emailConflict) {
        throw new ConflictError('User with this email already exists');
      }
    }

    // If password is being updated, hash it
    if (userData.password) {
      userData.passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
      delete userData.password;
    }

    const updatedUser = await UserRepository.update(id, userData);
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete a user
   */
  async deleteUser(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await UserRepository.delete(id);
  }

  /**
   * Validate user data
   */
  validateUserData(data) {
    const errors = [];

    if (!data.email || data.email.trim() === '') {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!data.name || data.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (!data.role) {
      errors.push({ field: 'role', message: 'Role is required' });
    }

    const validRoles = ['ADMIN', 'TEACHER', 'PARENT'];
    if (data.role && !validRoles.includes(data.role)) {
      errors.push({ field: 'role', message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    if (errors.length > 0) {
      throw new ValidationError('User validation failed', errors);
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new UserService();

