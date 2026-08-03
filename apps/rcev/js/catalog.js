const CATALOG_URL = new URL("../data/catalog.json", import.meta.url);

export async function loadCatalog() {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) throw new Error(`Catalog request failed with ${response.status}.`);
  const catalog = await response.json();
  validateCatalog(catalog);
  return catalog;
}

export function validateCatalog(catalog) {
  if (!catalog || !Array.isArray(catalog.chapters)) throw new Error("The catalog does not contain chapters.");
  if (catalog.chapters.length !== 5) throw new Error("The catalog must contain five chapters.");
  const videoIds = new Set();
  for (const chapter of catalog.chapters) {
    if (!Array.isArray(chapter.videos) || chapter.videos.length !== 8) throw new Error(`${chapter.id} must contain eight videos.`);
    const sequences = new Set();
    for (const video of chapter.videos) {
      if (video.chapterId !== chapter.id) throw new Error(`${video.id} has an invalid chapter reference.`);
      if (videoIds.has(video.id)) throw new Error(`Duplicate video id: ${video.id}`);
      if (sequences.has(video.sequence)) throw new Error(`Duplicate sequence in ${chapter.id}.`);
      if (!video.media?.path?.startsWith("./media/")) throw new Error(`${video.id} has an invalid media path.`);
      if (!video.figure?.path?.startsWith("./media/")) throw new Error(`${video.id} has an invalid figure path.`);
      if (!video.figure.alt) throw new Error(`${video.id} is missing figure alternative text.`);
      videoIds.add(video.id); sequences.add(video.sequence);
    }
  }
  if (videoIds.size !== 40) throw new Error("The catalog must contain forty unique videos.");
  return true;
}

export function findChapter(catalog, id) {
  return catalog.chapters.find((chapter) => chapter.id === id) ?? null;
}

export function findVideo(chapter, id) {
  return chapter?.videos.find((video) => video.id === id) ?? null;
}
