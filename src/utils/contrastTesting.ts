import { Theme, getAllThemes } from '@/config/themes';
import { validateColorContrast, ContrastReport } from '@/services/theme/themeService';
import { getContrastRatio } from '@/services/theme/colorUtils';

export interface ContrastAuditReport {
  themeName: string;
  themeId: string;
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  issues: Array<{
    pair: string;
    ratio: number;
    required: number;
    status: 'pass' | 'fail';
  }>;
}

export interface ContrastIssue {
  element: string;
  foregroundColor: string;
  backgroundColor: string;
  ratio: number;
  expectedRatio: number;
  wcagLevel: 'AA' | 'AAA';
}

/**
 * Audit a single theme for contrast compliance
 */
export function auditThemeContrast(theme: Theme): ContrastAuditReport {
  const report = validateColorContrast(theme.colors);

  const issues = report.issues.map(issue => ({
    pair: issue.pair,
    ratio: issue.ratio,
    required: issue.required,
    status: issue.ratio >= issue.required ? 'pass' as const : 'fail' as const,
  }));

  return {
    themeName: theme.name,
    themeId: theme.id,
    passed: report.passes,
    totalChecks: report.summary.totalChecks,
    passedChecks: report.summary.passed,
    failedChecks: report.summary.failed,
    issues,
  };
}

/**
 * Find contrast issues in a DOM element
 */
export function findContrastIssues(element: HTMLElement): ContrastIssue[] {
  const issues: ContrastIssue[] = [];

  // Get computed styles
  const styles = window.getComputedStyle(element);
  const backgroundColor = styles.backgroundColor;
  const color = styles.color;

  // Skip if transparent or not visible
  if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
    return issues;
  }

  try {
    const ratio = getContrastRatio(color, backgroundColor);
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = parseInt(styles.fontWeight);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);

    // Check AA compliance
    const requiredAA = isLargeText ? 3 : 4.5;
    if (ratio < requiredAA) {
      issues.push({
        element: element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ')[0] : ''),
        foregroundColor: color,
        backgroundColor: backgroundColor,
        ratio,
        expectedRatio: requiredAA,
        wcagLevel: 'AA',
      });
    }

    // Check AAA compliance
    const requiredAAA = isLargeText ? 4.5 : 7;
    if (ratio < requiredAAA) {
      issues.push({
        element: element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ')[0] : ''),
        foregroundColor: color,
        backgroundColor: backgroundColor,
        ratio,
        expectedRatio: requiredAAA,
        wcagLevel: 'AAA',
      });
    }
  } catch (error) {
    console.error('Error checking contrast for element:', element, error);
  }

  return issues;
}

/**
 * Generate a comprehensive contrast report for all themes
 */
export function generateContrastReport(): string {
  const themes = getAllThemes();
  const reports = themes.map(auditThemeContrast);

  let report = '# Theme Contrast Audit Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  for (const themeReport of reports) {
    report += `## ${themeReport.themeName} (${themeReport.themeId})\n\n`;
    report += `- **Status**: ${themeReport.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Total Checks**: ${themeReport.totalChecks}\n`;
    report += `- **Passed**: ${themeReport.passedChecks}\n`;
    report += `- **Failed**: ${themeReport.failedChecks}\n\n`;

    if (themeReport.issues.length > 0) {
      report += '### Issues\n\n';
      for (const issue of themeReport.issues) {
        report += `- **${issue.pair}**: ${issue.ratio.toFixed(2)}:1 (requires ${issue.required}:1) - ${issue.status === 'pass' ? '✅' : '❌'}\n`;
      }
      report += '\n';
    }
  }

  return report;
}

/**
 * Test all themes and return a map of theme IDs to audit reports
 */
export function testAllThemes(): Map<string, ContrastAuditReport> {
  const themes = getAllThemes();
  const results = new Map<string, ContrastAuditReport>();

  for (const theme of themes) {
    results.set(theme.id, auditThemeContrast(theme));
  }

  return results;
}

/**
 * Export contrast report to JSON
 */
export function exportContrastReportJSON(): string {
  const results = testAllThemes();
  const data = Array.from(results.values());
  return JSON.stringify(data, null, 2);
}

/**
 * Check if page meets minimum contrast requirements
 */
export function checkPageContrast(minRatio: number = 4.5): {
  passed: boolean;
  issues: ContrastIssue[];
  totalElements: number;
} {
  const allElements = document.querySelectorAll('*');
  const issues: ContrastIssue[] = [];
  let totalElements = 0;

  allElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      const elementIssues = findContrastIssues(element);
      issues.push(...elementIssues);
      totalElements++;
    }
  });

  return {
    passed: issues.length === 0,
    issues,
    totalElements,
  };
}

/**
 * Log contrast issues to console
 */
export function logContrastIssues(): void {
  const { passed, issues, totalElements } = checkPageContrast();

  console.group('🎨 Contrast Audit');
  console.log(`Total elements checked: ${totalElements}`);
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Issues found: ${issues.length}`);

  if (issues.length > 0) {
    console.group('Issues:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.element}`);
      console.log(`   Ratio: ${issue.ratio.toFixed(2)}:1 (requires ${issue.expectedRatio}:1)`);
      console.log(`   FG: ${issue.foregroundColor}, BG: ${issue.backgroundColor}`);
    });
    console.groupEnd();
  }

  console.groupEnd();
}
