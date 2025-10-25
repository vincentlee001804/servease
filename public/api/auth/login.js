// Simple API endpoint for login
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  // For demo purposes, accept any email/password combination
  // In production, you would validate against Firestore
  if (email && password) {
    const token = 'demo-token-' + Date.now();
    
    res.status(200).json({
      token,
      user: {
        email,
        name: 'Demo User',
        businessName: 'Demo Business',
        role: 'vendor'
      }
    });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
}
