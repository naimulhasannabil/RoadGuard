// Admin Configuration - Add authorized admin email addresses here
// Only users with emails in this list can access the Admin Dashboard

export const ADMIN_EMAILS = [
  // Add your admin email addresses below:
  'naharbably48@gmail.com',        // Replace with your actual email
      
  // Add more admin emails as needed:
  // 'teammate1@example.com',
  // 'teammate2@example.com',
]

// Check if an email is authorized as admin
export const isAdminEmail = (email) => {
  if (!email) return false
  return ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === email.toLowerCase()
  )
}
