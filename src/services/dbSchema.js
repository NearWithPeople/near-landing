export const DB_SCHEMA = {
  version: 2,
  summary: 'Unified role-based schema for vacancy web app',
  roles: ['user', 'employer', 'admin'],
  tables: {
    users: ['id', 'role', 'fullName', 'companyName', 'phone', 'email', 'onboardingCompleted', 'onboardingData', 'createdAt'],
    vacancies: ['id', 'ownerId', 'title', 'companyName', 'payFrom', 'address', 'lat', 'lng', 'type', 'duration', 'schedule', 'status', 'tags'],
    reviews: ['id', 'authorName', 'authorRole', 'targetName', 'rating', 'text', 'createdAt'],
    completedTasks: ['id', 'userId', 'title', 'employerName', 'completedAt', 'pay', 'duration', 'address', 'summary'],
  },
}

