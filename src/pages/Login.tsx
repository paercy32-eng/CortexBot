import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    setLoading(true);
    // Assuming you use phone number as email in Supabase (e.g., 2567...@cortexbot.com)
    const { error } = await supabase.auth.signInWithPassword({
      email: `${phone}@cortexbot.com`, 
      password: password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/'); // Redirect to Home
    }
    setLoading(false);
  };

  return (
    <div className="auth-screen active">
      <div className="auth-header">
        <h1 className="neon-text">CORTEXBOT</h1>
        <h2>Welcome</h2>
      </div>
      <div className="input-group">
        <span className="input-icon">📱</span>
        <input 
          type="text" 
          placeholder="Phone Number" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
        />
      </div>
      <div className="input-group">
        <span className="input-icon">🔑</span>
        <input 
          type="password" 
          placeholder="Login Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>
      <button className="btn-primary" onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {/* Add Link to Register */}
    </div>
  );
}
