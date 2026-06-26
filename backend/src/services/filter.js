// Returns true if a job matches a user's filter preferences.
// All comparisons are case-insensitive substring checks.

function norm(value) {
  return (value || '').toString().toLowerCase();
}

export function matchesUser(job, user) {
  const filters = (user && user.filters) || {};
  const roles = (filters.roles || []).map(norm).filter(Boolean);
  const locations = (filters.locations || []).map(norm).filter(Boolean);
  const experience = (filters.experience || []).map(norm).filter(Boolean);

  const title = norm(job.title);
  const jobLocation = norm(job.location);
  const jobExperience = norm(job.experience);

  // Role: title must include at least one preferred role.
  // If user set no roles, treat as "any role".
  const roleMatch = roles.length === 0 || roles.some((r) => title.includes(r));
  if (!roleMatch) return false;

  // Location: job location includes a preferred location, OR job is remote,
  // OR user opted into "anywhere". No location preference = any location.
  const locationMatch =
    locations.length === 0 ||
    locations.some((l) => jobLocation.includes(l)) ||
    jobLocation.includes('remote') ||
    locations.includes('anywhere');
  if (!locationMatch) return false;

  // Experience: job experience includes a preferred level, OR job has no
  // experience info. No experience preference = any experience.
  const experienceMatch =
    experience.length === 0 ||
    jobExperience === '' ||
    experience.some((e) => jobExperience.includes(e));
  if (!experienceMatch) return false;

  return true;
}

export default matchesUser;
