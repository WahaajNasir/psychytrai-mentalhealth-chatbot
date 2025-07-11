export function detectCriticalIssues(text) {
  const t = text.toLowerCase();
  return {
    abuse: t.includes('abuse') || t.includes('hit me') || t.includes('hurt me'),
    suicide: t.includes('kill myself') || t.includes('don’t want to live') || t.includes('suicide'),
  };
}
