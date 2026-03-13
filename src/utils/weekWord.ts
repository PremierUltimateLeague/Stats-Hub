const WEEK_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** Convert a week number (1-10) to its written form: 1 → "One" */
export function weekWord(n: number): string {
  return WEEK_WORDS[n - 1] ?? String(n);
}

/** Convert a week string from JSON data: "Week 1" → "Week One", "Semifinals" → "Semifinals" */
export function weekDisplay(week: string): string {
  return week.replace(/^Week (\d+)$/, (_, n) => `Week ${WEEK_WORDS[parseInt(n) - 1] ?? n}`);
}
