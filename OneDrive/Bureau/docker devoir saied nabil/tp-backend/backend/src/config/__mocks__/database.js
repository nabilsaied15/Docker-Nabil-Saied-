const normalizeQuery = (query = '') =>
  query.replace(/\s+/g, ' ').trim().toUpperCase();

const state = {
  users: [],
  activities: [],
  goals: [],
};

let userIdSeq = 1;
let activityIdSeq = 1;
let goalIdSeq = 1;

const resetState = () => {
  state.users.length = 0;
  state.activities.length = 0;
  state.goals.length = 0;
  userIdSeq = 1;
  activityIdSeq = 1;
  goalIdSeq = 1;
};

const cloneUserForReturn = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return { ...rest };
};

const pgPool = {
  query: async (query, values = []) => {
    const normalized = normalizeQuery(query);

    const findUserById = (id) =>
      state.users.find((u) => u.id === Number(id));
    const findUserByEmail = (email) =>
      state.users.find((u) => u.email === email);
    const matchLike = (email, pattern) => {
      const regex = new RegExp(
        `^${pattern.replace(/[%_]/g, (m) => (m === '%' ? '.*' : '.'))}$`,
        'i'
      );
      return regex.test(email);
    };

    if (normalized.startsWith('DELETE FROM USERS WHERE EMAIL LIKE')) {
      const pattern = values[0] || '';
      state.users = state.users.filter(
        (user) => !matchLike(user.email, pattern)
      );
      return { rows: [], rowCount: 0 };
    }

    if (normalized.startsWith('INSERT INTO USERS')) {
      const [email, password, role = 'user'] = values;
      const now = new Date();
      const newUser = {
        id: userIdSeq++,
        email,
        password,
        role,
        created_at: now,
        updated_at: now,
      };
      state.users.push(newUser);
      return {
        rows: [
          {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            created_at: newUser.created_at,
          },
        ],
      };
    }

    if (normalized.startsWith('SELECT * FROM USERS WHERE EMAIL')) {
      const [email] = values;
      const user = findUserByEmail(email);
      return { rows: user ? [user] : [] };
    }

    if (normalized.startsWith('SELECT ID, EMAIL, PASSWORD, ROLE, CREATED_AT FROM USERS WHERE ID')) {
      const [id] = values;
      const user = findUserById(id);
      return { rows: user ? [{ ...user }] : [] };
    }

    if (normalized.startsWith('SELECT ID, EMAIL, ROLE, CREATED_AT FROM USERS WHERE ID')) {
      const [id] = values;
      const user = findUserById(id);
      return { rows: user ? [cloneUserForReturn(user)] : [] };
    }

    if (normalized.startsWith('SELECT * FROM USERS WHERE ID')) {
      const [id] = values;
      const user = findUserById(id);
      return { rows: user ? [user] : [] };
    }

    if (normalized.startsWith('UPDATE USERS')) {
      const userId = values[values.length - 1];
      const user = findUserById(userId);
      if (!user) {
        return { rows: [] };
      }

      const setClause = normalized
        .split('SET')[1]
        .split('WHERE')[0];

      let valueIndex = 0;
      if (setClause.includes('EMAIL =')) {
        user.email = values[valueIndex++];
      }
      if (setClause.includes('PASSWORD =')) {
        user.password = values[valueIndex++];
      }
      user.updated_at = new Date();

      return {
        rows: [
          {
            id: user.id,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
        ],
      };
    }

    if (normalized.startsWith('SELECT COUNT(*) FROM USERS')) {
      let filtered = [...state.users];
      if (normalized.includes('ILIKE')) {
        const pattern = values[0];
        filtered = filtered.filter((user) =>
          matchLike(user.email, pattern)
        );
      }
      return { rows: [{ count: String(filtered.length) }] };
    }

    if (normalized.startsWith('SELECT ID, EMAIL, ROLE, CREATED_AT FROM USERS WHERE 1=1')) {
      let filtered = [...state.users];
      let valueIndex = 0;
      if (normalized.includes('ILIKE')) {
        const pattern = values[valueIndex++];
        filtered = filtered.filter((user) =>
          matchLike(user.email, pattern)
        );
      }

      const limit = Number(values[valueIndex++] ?? 10);
      const offset = Number(values[valueIndex] ?? 0);

      const sliced = filtered
        .slice()
        .sort(
          (a, b) => b.created_at.getTime() - a.created_at.getTime()
        )
        .slice(offset, offset + limit)
        .map(cloneUserForReturn);

      return { rows: sliced };
    }

    if (normalized.startsWith('DELETE FROM USERS WHERE ID')) {
      const [id] = values;
      const index = state.users.findIndex((u) => u.id === Number(id));
      if (index !== -1) {
        state.users.splice(index, 1);
      }
      return { rows: [], rowCount: 1 };
    }

    if (normalized.startsWith('INSERT INTO ACTIVITIES')) {
      const [userId, type, duration, calories, distance, notes] = values;
      const now = new Date();
      const newActivity = {
        id: activityIdSeq++,
        user_id: Number(userId),
        type,
        duration,
        calories: calories ?? 0,
        distance: distance ?? 0,
        notes,
        date: now,
        created_at: now,
        updated_at: now,
      };
      state.activities.push(newActivity);
      return { rows: [newActivity] };
    }

    if (normalized.startsWith('SELECT * FROM ACTIVITIES WHERE USER_ID =')) {
      const [userId] = values;
      const filtered = state.activities
        .filter((activity) => activity.user_id === Number(userId))
        .slice()
        .sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        );

      if (normalized.includes('LIMIT')) {
        const limit = Number(values[values.length - 2]);
        const offset = Number(values[values.length - 1]);
        return {
          rows: filtered.slice(offset, offset + limit),
        };
      }

      return { rows: filtered };
    }

    if (normalized.startsWith('SELECT COUNT(*) FROM ACTIVITIES WHERE USER_ID =')) {
      const [userId] = values;
      const total = state.activities.filter(
        (activity) => activity.user_id === Number(userId)
      ).length;
      return { rows: [{ count: String(total) }] };
    }

    if (normalized.startsWith('SELECT * FROM ACTIVITIES WHERE ID =')) {
      const [id] = values;
      const activity = state.activities.find(
        (act) => act.id === Number(id)
      );
      return { rows: activity ? [activity] : [] };
    }

    if (normalized.startsWith('DELETE FROM ACTIVITIES WHERE ID =')) {
      const [id, userId] = values;
      const index = state.activities.findIndex(
        (activity) =>
          activity.id === Number(id) &&
          activity.user_id === Number(userId)
      );
      if (index !== -1) {
        state.activities.splice(index, 1);
      }
      return { rows: [], rowCount: 1 };
    }

    if (normalized.includes('FROM ACTIVITIES') && normalized.includes('SUM(')) {
      const [userId] = values;
      const activities = state.activities.filter(
        (act) => act.user_id === Number(userId)
      );

      if (normalized.startsWith('SELECT COUNT(*) AS TOTAL_ACTIVITIES')) {
        const totalActivities = activities.length;
        const totalDuration = activities.reduce(
          (sum, act) => sum + (act.duration || 0),
          0
        );
        const totalCalories = activities.reduce(
          (sum, act) => sum + (act.calories || 0),
          0
        );
        const totalDistance = activities.reduce(
          (sum, act) => sum + (act.distance || 0),
          0
        );
        const avgDuration =
          totalActivities > 0 ? totalDuration / totalActivities : 0;

        return {
          rows: [
            {
              total_activities: totalActivities,
              total_duration: totalDuration,
              total_calories: totalCalories,
              total_distance: totalDistance,
              avg_duration: avgDuration,
            },
          ],
        };
      }

      if (normalized.startsWith('SELECT TYPE, COUNT(*) AS COUNT')) {
        const byType = activities.reduce((acc, act) => {
          if (!acc[act.type]) {
            acc[act.type] = {
              type: act.type,
              count: 0,
              total_duration: 0,
              total_calories: 0,
              total_distance: 0,
            };
          }
          acc[act.type].count += 1;
          acc[act.type].total_duration += act.duration || 0;
          acc[act.type].total_calories += act.calories || 0;
          acc[act.type].total_distance += act.distance || 0;
          return acc;
        }, {});

        return {
          rows: Object.values(byType),
        };
      }
    }

    if (normalized.startsWith('SELECT COUNT(*) AS TOTAL_WORKOUTS FROM WORKOUTS')) {
      return { rows: [{ total_workouts: 0 }] };
    }

    if (normalized.startsWith('SELECT COUNT(*) AS TOTAL_MEALS FROM MEALS')) {
      return { rows: [{ total_meals: 0, total_calories_consumed: 0 }] };
    }

    if (normalized.startsWith('INSERT INTO GOALS')) {
      const [userId, title, description, type, targetValue, startDate, endDate] = values;
      const now = new Date();
      const newGoal = {
        id: goalIdSeq++,
        user_id: Number(userId),
        title,
        description,
        type,
        target_value: Number(targetValue),
        current_value: 0,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      state.goals.push(newGoal);
      return { rows: [newGoal] };
    }

    if (normalized.includes('SELECT * FROM GOALS WHERE USER_ID =') && normalized.includes('AND STATUS =') && normalized.includes('ORDER BY CREATED_AT DESC')) {
      const [userId, status] = values;
      const filtered = (state.goals || [])
        .filter((goal) => goal.user_id === Number(userId) && goal.status === status)
        .slice()
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      return { rows: filtered };
    }

    if (normalized.startsWith('SELECT * FROM GOALS WHERE USER_ID =')) {
      const [userId] = values;
      const filtered = (state.goals || [])
        .filter((goal) => goal.user_id === Number(userId))
        .slice()
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      return { rows: filtered };
    }

    if (normalized.startsWith('SELECT * FROM GOALS WHERE ID =')) {
      const [id] = values;
      const goal = state.goals.find((g) => g.id === Number(id));
      return { rows: goal ? [goal] : [] };
    }

    if (normalized.startsWith('UPDATE GOALS')) {
      const goalId = values[values.length - 2];
      const userId = values[values.length - 1];
      const goal = state.goals.find(
        (g) => g.id === Number(goalId) && g.user_id === Number(userId)
      );
      if (!goal) {
        return { rows: [] };
      }

      const setClause = normalized.split('SET')[1]?.split('WHERE')[0] || '';
      
      if (setClause.includes('CURRENT_VALUE =') && setClause.includes('CASE')) {
        const currentValue = Number(values[0]);
        goal.current_value = currentValue;
        if (currentValue >= goal.target_value) {
          goal.status = 'completed';
        }
        goal.updated_at = new Date();
        return { rows: [{ ...goal }] };
      }
      
      let valueIndex = 0;
      if (setClause.includes('TITLE =')) {
        goal.title = values[valueIndex++];
      }
      if (setClause.includes('DESCRIPTION =')) {
        goal.description = values[valueIndex++];
      }
      if (setClause.includes('TARGET_VALUE =')) {
        goal.target_value = Number(values[valueIndex++]);
      }
      if (setClause.includes('CURRENT_VALUE =')) {
        goal.current_value = Number(values[valueIndex++]);
      }
      if (setClause.includes('START_DATE =')) {
        goal.start_date = values[valueIndex++];
      }
      if (setClause.includes('END_DATE =')) {
        goal.end_date = values[valueIndex++];
      }
      if (setClause.includes('STATUS =')) {
        goal.status = values[valueIndex++];
      }
      
      goal.updated_at = new Date();
      return { rows: [{ ...goal }] };
    }

    if (normalized.startsWith('DELETE FROM GOALS WHERE ID =')) {
      const [id, userId] = values;
      const index = state.goals.findIndex(
        (goal) => goal.id === Number(id) && goal.user_id === Number(userId)
      );
      if (index !== -1) {
        state.goals.splice(index, 1);
      }
      return { rows: [], rowCount: 1 };
    }

    throw new Error(`Query not mocked: ${query}`);
  },
  end: async () => {},
};

const connectMongoDB = async () => {};

module.exports = {
  pgPool,
  connectMongoDB,
  __resetMockData: resetState,
  __getMockState: () => state,
};

