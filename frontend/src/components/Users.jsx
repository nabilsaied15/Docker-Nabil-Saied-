import { useState, useEffect } from 'react';
import api from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [pagination.page, search]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsers(pagination.page, pagination.limit, search);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadUsers();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await api.deleteUser(userId);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="activities-container">
      <div className="section-header">
        <h2>👥 Gestion des Utilisateurs (Admin)</h2>
        <div className="users-stats">
          <span>Total: {pagination.total} utilisateur{pagination.total > 1 ? 's' : ''}</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-form" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Rechercher par email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn btn-primary">Rechercher</button>
        {search && (
          <button 
            type="button" 
            onClick={() => {
              setSearch('');
              setPagination({ ...pagination, page: 1 });
            }}
            className="btn btn-secondary"
          >
            Effacer
          </button>
        )}
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Chargement des utilisateurs...</div>
      ) : (
        <>
          {users.length === 0 ? (
            <div className="empty-state">
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Rôle</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Date d'inscription</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr 
                      key={user.id} 
                      style={{ 
                        borderBottom: '1px solid #eee',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
                      }}
                    >
                      <td style={{ padding: '12px' }}>{user.id}</td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>📧 {user.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{ 
                            backgroundColor: user.role === 'admin' ? '#f44336' : '#4caf50',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-danger"
                          disabled={loading}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Précédent
              </button>
              <span>
                Page {pagination.page} sur {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Users;

