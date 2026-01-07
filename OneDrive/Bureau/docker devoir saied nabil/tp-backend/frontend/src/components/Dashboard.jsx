import { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, goalsData, activitiesData] = await Promise.all([
        api.getActivityStats(period),
        api.getGoals('active'),
        api.getActivities()
      ]);
      setStats(statsData);
      setGoals(goalsData);
      setRecentActivities(activitiesData.slice(0, 5));
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeLabel = (type) => {
    const labels = {
      running: 'Course',
      cycling: 'Vélo',
      swimming: 'Natation',
      walking: 'Marche',
      gym: 'Salle de sport',
      yoga: 'Yoga',
      hiking: 'Randonnée',
      tennis: 'Tennis',
      basketball: 'Basketball',
      football: 'Football'
    };
    return labels[type] || type;
  };

  const getProgressPercentage = (current, target) => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 0;
    if (!targetNum || targetNum === 0) return 0;
    const percentage = (currentNum / targetNum) * 100;
    return Math.min(percentage, 100);
  };

  if (loading) {
    return <div className="loading">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de Bord</h1>
        <div className="period-selector">
          <button 
            className={period === 'week' ? 'active' : ''}
            onClick={() => setPeriod('week')}
          >
            Semaine
          </button>
          <button 
            className={period === 'month' ? 'active' : ''}
            onClick={() => setPeriod('month')}
          >
            Mois
          </button>
          <button 
            className={period === 'year' ? 'active' : ''}
            onClick={() => setPeriod('year')}
          >
            Année
          </button>
          <button 
            className={period === 'all' ? 'active' : ''}
            onClick={() => setPeriod('all')}
          >
            Tout
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">🏃</div>
            <div className="stat-content">
              <div className="stat-label">Activités</div>
              <div className="stat-value">{stats.totalActivities}</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-label">Durée totale</div>
              <div className="stat-value">{stats.totalDuration} min</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-label">Calories</div>
              <div className="stat-value">{stats.totalCalories}</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📏</div>
            <div className="stat-content">
              <div className="stat-label">Distance</div>
              <div className="stat-value">{(parseFloat(stats.totalDistance) || 0).toFixed(1)} km</div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Mes Objectifs</h2>
          {goals.length === 0 ? (
            <div className="empty-state">
              <p>Aucun objectif actif</p>
            </div>
          ) : (
            <div className="goals-list">
              {goals.map((goal) => {
                const progress = getProgressPercentage(goal.current_value, goal.target_value);
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <h3>{goal.title}</h3>
                      <span className={`goal-status ${goal.status}`}>
                        {goal.status === 'completed' ? '✅' : '🎯'}
                      </span>
                    </div>
                    {goal.description && <p className="goal-description">{goal.description}</p>}
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {(parseFloat(goal.current_value) || 0).toFixed(1)} / {parseFloat(goal.target_value) || 0} {goal.type}
                        <span className="progress-percentage">({progress.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="goal-dates">
                      {new Date(goal.start_date).toLocaleDateString('fr-FR')} - {new Date(goal.end_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Activités Récentes</h2>
          {recentActivities.length === 0 ? (
            <div className="empty-state">
              <p>Aucune activité récente</p>
            </div>
          ) : (
            <div className="activities-preview">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="activity-preview-card">
                  <div className="activity-type-badge">{getActivityTypeLabel(activity.type)}</div>
                  <div className="activity-details">
                    <div className="activity-detail">
                      <span className="detail-icon">⏱️</span>
                      <span>{activity.duration} min</span>
                    </div>
                    {activity.calories && (
                      <div className="activity-detail">
                        <span className="detail-icon">🔥</span>
                        <span>{activity.calories} cal</span>
                      </div>
                    )}
                    {activity.distance && (
                      <div className="activity-detail">
                        <span className="detail-icon">📏</span>
                        <span>{activity.distance} km</span>
                      </div>
                    )}
                  </div>
                  <div className="activity-date">
                    {new Date(activity.date || activity.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

