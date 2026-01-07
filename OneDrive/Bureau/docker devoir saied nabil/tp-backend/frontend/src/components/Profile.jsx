import { useState, useEffect } from 'react';
import api from '../services/api';

function Profile({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getProfile();
      setProfile(data);
      setFormData({ ...formData, email: data.email });
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData = {
        email: formData.email !== profile.email ? formData.email : undefined,
        currentPassword: formData.newPassword ? formData.currentPassword : undefined,
        newPassword: formData.newPassword || undefined,
      };

      const data = await api.updateProfile(
        updateData.email,
        updateData.currentPassword,
        updateData.newPassword
      );
      setProfile(data.user);
      setSuccess('Profil mis à jour avec succès');
      setEditMode(false);
      setFormData({ email: data.user.email, currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    onLogout();
  };

  if (loading && !profile) {
    return <div>Chargement du profil...</div>;
  }

  if (!profile) {
    return <div className="error">Erreur lors du chargement du profil</div>;
  }

  return (
    <div className="profile-container">
      <h2>Mon Profil</h2>
      
      {!editMode ? (
        <div className="profile-info">
          <div className="profile-info-item">
            <p><strong>Email:</strong> {profile.email}</p>
          </div>
          <div className="profile-info-item">
            <p><strong>Rôle:</strong> {profile.role}</p>
          </div>
          {profile.created_at && (
            <div className="profile-info-item">
              <p><strong>Membre depuis:</strong> {new Date(profile.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          )}
          <div className="profile-actions">
            <button onClick={() => setEditMode(true)}>Modifier le profil</button>
            <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="profile-form">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Nouveau mot de passe (laisser vide pour ne pas changer):</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              minLength={6}
            />
          </div>
          {formData.newPassword && (
            <div className="form-group">
              <label>Mot de passe actuel (requis pour changer le mot de passe):</label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                required={!!formData.newPassword}
              />
            </div>
          )}
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => {
              setEditMode(false);
              setFormData({ email: profile.email, currentPassword: '', newPassword: '' });
              setError('');
              setSuccess('');
            }}>
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;

