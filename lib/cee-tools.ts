import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type CeeTool = {
  path: string;
  title: string;
  description: string;
  tag: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const CEE_WEB_ORIGIN = 'https://smartprep-axom.pages.dev';

export const CEE_INTELLIGENCE_TOOLS: CeeTool[] = [
  { path: '/analytics', title: 'Intelligence Dashboard', description: 'Explore the published CEE intelligence overview and admission references.', tag: 'OVERVIEW', icon: 'analytics-outline' },
  { path: '/analytics/pyq-analysis', title: 'Chapter-wise PYQ Trends', description: 'Compare chapter frequency and question trends across exam years.', tag: 'PYQ ANALYSIS', icon: 'bar-chart-outline' },
  { path: '/cee-outlook', title: 'CEE Chapter Outlook', description: 'Review historical question counts, weightage and revision priorities.', tag: 'CHAPTER OUTLOOK', icon: 'trending-up-outline' },
  { path: '/analytics/exam-difficulty', title: 'Exam Difficulty', description: 'Explore subject-wise and year-wise exam difficulty analysis.', tag: 'EXAM ANALYSIS', icon: 'speedometer-outline' },
  { path: '/analytics/cee-2027-predictions', title: 'CEE 2027 Predictions', description: 'Explore chapter-priority signals based on historical paper trends.', tag: '2027 OUTLOOK', icon: 'sparkles-outline' },
  { path: '/predictor/rank', title: 'Rank Predictor', description: 'Estimate an indicative rank range using historical references.', tag: 'PREDICTOR', icon: 'podium-outline' },
  { path: '/predictor/marks-to-rank', title: 'Marks-to-Rank', description: 'Compare expected marks with historical rank and cutoff references.', tag: 'PREDICTOR', icon: 'calculator-outline' },
  { path: '/predictor/college', title: 'College Predictor', description: 'Explore indicative college and branch options for your expected rank.', tag: 'ADMISSIONS', icon: 'school-outline' },
  { path: '/analytics/college-cutoff-analysis', title: 'College Cutoff Explorer', description: 'Compare verified closing-rank references by college, branch and category.', tag: 'CUTOFFS', icon: 'business-outline' },
];

export const CEE_WORKSPACE_TOOLS: CeeTool[] = [
  { path: '/cee-tools', title: 'Workspace Home', description: 'Open the complete CEE preparation and admission-planning command centre.', tag: 'WORKSPACE', icon: 'grid-outline' },
  { path: '/daily-10', title: 'Daily 10', description: 'Attempt the daily 10-question PCM challenge with timed scoring.', tag: 'DAILY CHALLENGE', icon: 'calendar-outline' },
  { path: '/practice-arena', title: 'Practice Arena', description: 'Jump into focused practice and chapter learning tools.', tag: 'PRACTICE', icon: 'game-controller-outline' },
  { path: '/chapter-intelligence', title: 'Chapter Intelligence', description: 'Explore chapter frequency, weightage, difficulty and yearly trends.', tag: 'PYQ INTELLIGENCE', icon: 'bar-chart-outline' },
  { path: '/cee-outlook', title: 'CEE Chapter Outlook', description: 'Plan revision using historical chapter appearances and priorities.', tag: 'REVISION', icon: 'trending-up-outline' },
  { path: '/my-college-path', title: 'Preference Simulator', description: 'Build a ranked college and branch preference list against verified cutoffs.', tag: 'ELIGIBILITY', icon: 'git-branch-outline' },
  { path: '/admission-navigator', title: 'Admission Navigator', description: 'Prepare counselling documents and check official admission sources.', tag: 'ADMISSIONS', icon: 'compass-outline' },
  { path: '/my-cee-journey', title: 'My CEE Journey', description: 'Track study goals, sessions, weekly effort and revision notes.', tag: 'STUDY PLANNER', icon: 'trophy-outline' },
  { path: '/my-target-card', title: 'My CEE Target Card', description: 'Create and share your personal CEE target card.', tag: 'MY TARGET', icon: 'flag-outline' },
];

export const CEE_ALL_TOOLS = [...CEE_INTELLIGENCE_TOOLS, ...CEE_WORKSPACE_TOOLS];
