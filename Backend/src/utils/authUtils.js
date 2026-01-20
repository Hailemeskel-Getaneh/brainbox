/**
 * Utility functions for authentication related tasks.
 */

export const validatePassword = (password) => {
    // Basic password validation example
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    // Add more complex validation rules as needed
    return null; // No error
};
