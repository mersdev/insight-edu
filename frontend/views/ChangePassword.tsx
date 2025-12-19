import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { api } from '../services/backendApi';

interface ChangePasswordProps {
  onPasswordChanged: () => void;
  onLogout: () => void;
  userName: string;
  isFirstTime?: boolean;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ 
  onPasswordChanged, 
  onLogout, 
  userName,
  isFirstTime = false 
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setValidationErrors(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password strength
    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        onPasswordChanged();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-in zoom-in">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Password Changed!</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been successfully updated. Redirecting...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <div className="max-w-md w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-black rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-3">
            I
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isFirstTime ? 'Welcome, ' + userName : 'Change Password'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFirstTime 
              ? 'For security reasons, please change your password before continuing' 
              : 'Update your password to keep your account secure'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input 
                  type={showCurrentPassword ? "text" : "password"} 
                  placeholder="Enter current password" 
                  className="pl-10 pr-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-10 pr-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                  value={newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Requirements */}
              {newPassword && validationErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10 h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-md font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 text-base font-semibold mt-2 bg-black text-white hover:bg-black/90 rounded-lg"
              disabled={validationErrors.length > 0}
            >
              Change Password
            </Button>

            {/* Logout Option */}
            {!isFirstTime && (
              <Button
                type="button"
                variant="ghost"
                className="w-full h-10"
                onClick={onLogout}
              >
                Cancel
              </Button>
            )}
          </form>
        </div>

        {/* Password Requirements Info */}
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground mb-2">Password Requirements:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>At least 8 characters long</li>
            <li>At least one uppercase letter</li>
            <li>At least one number</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

