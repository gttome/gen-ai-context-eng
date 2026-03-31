export function getReadiness(mission, classifications, packageState = null) {
  const cards = mission.cards;
  const classified = cards.filter(card => Boolean(classifications[card.id]?.action));
  const essentialReady = cards.filter(card => card.essential)
    .every(card => Boolean(classifications[card.id]?.action));
  const allClassified = classified.length === cards.length;
  const policyReady = !packageState?.policyStatus?.violations?.length;
  const reviewReady = allClassified && essentialReady && policyReady;
  return {
    classifiedCount: classified.length,
    totalCount: cards.length,
    essentialReady,
    policyReady,
    reviewReady
  };
}
