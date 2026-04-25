import { BADGES } from '../data/badges';

export const XP_REWARDS = {
  COMPLETE_TASK: 30,
  COMPLETE_SEVERITY_5: 80,
  FIRST_TASK: 20,
  WEEKLY_STREAK: 15,
  FIVE_STAR_RATING: 25,
};

const LEVELS = [
  { level: 1, name: 'Newcomer', xpRequired: 0 },
  { level: 2, name: 'Helper', xpRequired: 100 },
  { level: 3, name: 'Contributor', xpRequired: 300 },
  { level: 4, name: 'Community Champion', xpRequired: 600 },
  { level: 5, name: 'Impact Maker', xpRequired: 1000 },
  { level: 6, name: 'Area Legend', xpRequired: 2000 },
];

export function calculateLevel(xp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
  }
  const nextLevel = LEVELS[current.level] || null;
  return {
    ...current,
    nextLevel,
    progressPercent: nextLevel
      ? ((xp - current.xpRequired) / (nextLevel.xpRequired - current.xpRequired)) * 100
      : 100,
  };
}

export function checkBadges(volunteerData, previousBadges = []) {
  const newlyEarned = [];
  for (const badge of BADGES) {
    if (!previousBadges.includes(badge.id) && badge.check(volunteerData)) {
      newlyEarned.push(badge);
    }
  }
  return newlyEarned;
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

function getPreviousWeek(weekStr) {
  const [year, week] = weekStr.split('-W').map(Number);
  if (week <= 1) return `${year - 1}-W52`;
  return `${year}-W${week - 1}`;
}

export function updateStreak(volunteerData) {
  const now = new Date();
  const currentWeek = `${now.getFullYear()}-W${getWeekNumber(now)}`;
  const lastWeek = getPreviousWeek(currentWeek);

  if (volunteerData.lastActiveWeek === currentWeek) {
    return { streakWeeks: volunteerData.streakWeeks, lastActiveWeek: currentWeek };
  } else if (volunteerData.lastActiveWeek === lastWeek) {
    return { streakWeeks: (volunteerData.streakWeeks || 0) + 1, lastActiveWeek: currentWeek };
  } else {
    return { streakWeeks: 1, lastActiveWeek: currentWeek };
  }
}

export function xpForTaskCompletion(task, volunteerData) {
  let xpGain = XP_REWARDS.COMPLETE_TASK;
  if (task.severityScore >= 5) xpGain = XP_REWARDS.COMPLETE_SEVERITY_5;
  if ((volunteerData.totalTasks || 0) === 0) xpGain += XP_REWARDS.FIRST_TASK;
  return xpGain;
}
