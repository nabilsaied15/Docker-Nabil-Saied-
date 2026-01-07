import { useState, useEffect } from 'react';
import api from '../services/api';

function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'distance',
    activity_type: '',
    target_value: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadGoals();
  }, [filterStatus]);

  const loadGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getGoals(filterStatus || null);
      setGoals(data);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des objectifs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const goalData = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        activity_type: formData.activity_type || undefined,
        target_value: parseFloat(formData.target_value),
        start_date: formData.start_date,
        end_date: formData.end_date,
      };

      await api.createGoal(goalData);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'distance',
        activity_type: '',
        target_value: '',
        start_date: '',
        end_date: '',
      });
      loadGoals();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.deleteGoal(id);
      loadGoals();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (id) => {
    setLoading(true);
    setError('');
    try {
      await api.updateGoalProgress(id);
      loadGoals();
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la progression';
      if (errorMessage.includes('non trouvé') || errorMessage.includes('404')) {
        setError('Cet objectif n\'existe plus. Veuillez rafraîchir la page.');
        setTimeout(() => loadGoals(), 1000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (goal) => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    const current = parseFloat(goal.current_value) || 0;
    const target = parseFloat(goal.target_value) || 0;
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      duration: 'Durée (minutes)',
      distance: 'Distance (km)',
      calories: 'Calories',
      activities_count: "Nombre d'activités",
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="activities-container">
      <div className="section-header">
        <h2>🎯 Mes Objectifs</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Annuler' : '+ Nouvel Objectif'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="activity-form">
          <h3>Créer un nouvel objectif</h3>
          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Courir 100 km ce mois"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de l'objectif..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="duration">Durée (minutes)</option>
                <option value="distance">Distance (km)</option>
                <option value="calories">Calories</option>
                <option value="activities_count">Nombre d'activités</option>
              </select>
            </div>

            <div className="form-group">
              <label>Type d'activité (optionnel)</label>
              <select
                value={formData.activity_type}
                onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
              >
                <option value="">Tous les types</option>
                <option value="running">Course à pied</option>
                <option value="cycling">Vélo</option>
                <option value="swimming">Natation</option>
                <option value="walking">Marche</option>
                <option value="gym">Gym</option>
                <option value="yoga">Yoga</option>
                <option value="hiking">Randonnée</option>
                <option value="tennis">Tennis</option>
                <option value="basketball">Basketball</option>
                <option value="football">Football</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valeur cible *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                required
                placeholder="100"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date de début *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Date de fin *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                min={formData.start_date}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Création...' : 'Créer l\'objectif'}
          </button>
        </form>
      )}

      <div className="filter-section">
        <label>Filtrer par statut :</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous</option>
          <option value="active">Actifs</option>
          <option value="completed">Terminés</option>
          <option value="cancelled">Annulés</option>
        </select>
      </div>

      {loading && !showForm && <div className="loading">Chargement...</div>}

      {!loading && goals.length === 0 && (
        <div className="empty-state">
          <p>Aucun objectif trouvé.</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              Créer mon premier objectif
            </button>
          )}
        </div>
      )}

      <div className="goals-list">
        {goals.map((goal) => {
          const progress = getProgressPercentage(goal);
          const isCompleted = goal.status === 'completed';
          const isOverdue = new Date(goal.end_date) < new Date() && !isCompleted;

          return (
            <div
              key={goal.id}
              className="goal-card"
              style={{ borderLeft: `4px solid ${getStatusColor(goal.status)}` }}
            >
              <div className="goal-header">
                <div>
                  <h3>{goal.title}</h3>
                  {goal.description && <p className="goal-description">{goal.description}</p>}
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(goal.status) }}
                >
                  {goal.status === 'active' ? 'Actif' : goal.status === 'completed' ? 'Terminé' : 'Annulé'}
                </span>
              </div>

              <div className="goal-info">
                <div className="info-item">
                  <span className="info-label">Type :</span>
                  <span>{getTypeLabel(goal.type)}</span>
                </div>
                {goal.activity_type && (
                  <div className="info-item">
                    <span className="info-label">Activité :</span>
                    <span style={{ textTransform: 'capitalize' }}>{goal.activity_type}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Période :</span>
                  <span>
                    {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
                  </span>
                </div>
                {isOverdue && (
                  <div className="warning-badge">⚠️ Délai dépassé</div>
                )}
              </div>

              <div className="goal-progress">
                <div className="progress-text">
                  <span>
                    {(parseFloat(goal.current_value) || 0).toFixed(2)} / {parseFloat(goal.target_value) || 0} {getTypeLabel(goal.type).split('(')[1]?.replace(')', '') || ''}
                  </span>
                  <span className="progress-percentage">{progress.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: isCompleted ? '#4caf50' : '#2196f3',
                    }}
                  />
                </div>
              </div>

              <div className="goal-actions">
                {goal.status === 'active' && (
                  <button
                    onClick={() => handleUpdateProgress(goal.id)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                     Mettre à jour la progression
                  </button>
                )}
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="btn btn-danger"
                  disabled={loading}
                >
                   Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Goals;

