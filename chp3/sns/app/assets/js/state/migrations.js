export function migrateSession(saved, appVersion) {
  if (!saved || typeof saved !== "object") return null;
  if (!saved.appVersion) return null;
  if (saved.appVersion !== appVersion) {
    return {
      ...saved,
      missionDirector: saved.missionDirector || {},
      session: null,
      needsResumeNotice: false
    };
  }
  return saved;
}
