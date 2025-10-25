// Simple API endpoint for registration
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, name, businessName } = req.body;

  // Simple validation
  if (!email || !password || !name || !businessName) {
    return res.status(400).json({ message: 'All fields required' });
  }

  // For demo purposes, always succeed
  res.status(201).json({ 
    message: 'User registered successfully',
    user: {
      email,
      name,
      businessName,
      role: 'vendor'
    }
  });
}
