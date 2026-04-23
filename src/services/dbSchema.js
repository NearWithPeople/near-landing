export const DB_SCHEMA = {
  version: 2,
  summary: 'Unified role-based schema for vacancy web app',
  roles: ['user', 'employer', 'admin'],
  tables: {
    users: ['id', 'role', 'fullName', 'companyName', 'age', 'phone', 'email', 'telegramUsername', 'review', 'onboardingCompleted', 'onboardingData', 'createdAt'],
    vacancies: ['id', 'ownerId', 'title', 'companyName', 'description', 'payFrom', 'address', 'lat', 'lng', 'type', 'duration', 'shiftDate', 'schedule', 'status', 'tags'],
    applications: ['id', 'vacancyId', 'vacancyTitle', 'applicantId', 'applicantName', 'employerName', 'status', 'createdAt'],
    reviews: ['id', 'authorName', 'authorRole', 'targetName', 'rating', 'text', 'createdAt'],
    completedTasks: ['id', 'userId', 'title', 'employerName', 'completedAt', 'pay', 'duration', 'address', 'summary'],
  },
}

