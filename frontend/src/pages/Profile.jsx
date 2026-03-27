import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Save, ShieldCheck, Globe, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useRef } from 'react';

const Profile = () => {
  const { user, updateProfileData } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'PKR');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  ];

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await axios.put('/auth/profile', { 
        name, 
        email, 
        defaultCurrency: currency,
        bio,
        phone,
        avatarUrl
      });
      updateProfileData(res.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Update Profile Error:', error);
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return setMessage({ type: 'danger', text: 'File too large. Max 5MB allowed.' });
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await axios.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setAvatarUrl(res.data.avatarUrl);
      setMessage({ type: 'success', text: 'Photo uploaded! Click Save to apply changes.' });
    } catch (error) {
      console.error('Avatar Upload Error:', error);
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Failed to upload photo' });
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ type: 'danger', text: 'New passwords do not match' });
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await axios.put('/auth/password', { currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Change Password Error:', error);
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: <User size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <Globe size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal identity and account preferences.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Tab Sidebar */}
        <div className="glass-panel" style={{ width: '240px', padding: '1rem', position: 'sticky', top: '1rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                marginBottom: '0.5rem',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          {message.text && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem', 
              backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: message.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShieldCheck size={20} />
              {message.text}
            </div>
          )}

          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="form-section">
                <section style={{ marginBottom: '3rem' }}>
                  <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                    <User color="var(--accent-primary)" size={22} /> Profile Identity
                  </h2>
                  
                  <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '3rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ 
                        width: '110px', 
                        height: '110px', 
                        borderRadius: '50%', 
                        overflow: 'hidden', 
                        border: '3px solid var(--accent-primary)',
                        background: 'var(--glass-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.2)'
                      }}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={44} color="var(--text-secondary)" />
                        )}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>Choose an Avatar</label>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Upload Button */}
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarUpload} 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                          />
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            style={{ 
                              width: '44px', height: '44px', borderRadius: '50%', border: 'none', 
                              background: 'var(--accent-primary)', color: 'white', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                              transition: 'all 0.2s ease'
                            }}
                            title="Upload from Gallery"
                            disabled={uploading}
                          >
                            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                          </button>
                        </div>

                        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.25rem' }} />

                        {avatars.map((url, i) => (
                          <button 
                            key={i}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={avatarUrl === url ? 'avatar-active' : ''}
                            style={{ 
                              padding: 0, 
                              border: avatarUrl === url ? '2px solid var(--accent-primary)' : '2px solid transparent',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              width: '44px',
                              height: '44px',
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              backgroundColor: 'transparent'
                            }}
                          >
                            <img src={url} style={{ width: '100%', height: '100%', border: 'none' }} alt="preset" />
                          </button>
                        ))}
                        <button 
                          type="button" 
                          onClick={() => setAvatarUrl('')}
                          style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px dashed var(--text-secondary)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600' }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="input-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        className="input-field" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input 
                        type="tel" 
                        className="input-field" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    <div className="input-group">
                      <label>About Me / Bio</label>
                      <textarea 
                        className="input-field" 
                        value={bio} 
                        onChange={e => setBio(e.target.value)} 
                        placeholder="Expert financial strategist..."
                        style={{ minHeight: '80px', paddingTop: '0.75rem', resize: 'none' }}
                      />
                    </div>
                  </div>
                </section>

                <div style={{ marginTop: '2.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'preferences' && (
              <form onSubmit={handleUpdateProfile} className="form-section">
                <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                  <Globe color="var(--accent-primary)" size={22} /> Locale & Currency
                </h2>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                  <div className="input-group" style={{ maxWidth: '400px', marginBottom: 0 }}>
                    <label>Default Currency</label>
                    <select 
                      className="input-field" 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                    >
                      <option value="PKR">PKR (Pakistani Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      This sets your primary display currency across all dashboards and reports.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={18} /> {loading ? 'Update Preferences' : 'Update Preferences'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="form-section">
                <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                  <Lock color="var(--accent-primary)" size={22} /> Security Settings
                </h2>
                
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Ensure your account stays secure by using a strong, unique password.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label>Current Password</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }} />
                  
                  <div className="input-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Confirm New Password</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6' }}>
                    <ShieldCheck size={18} /> {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
