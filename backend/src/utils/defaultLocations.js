export const DEFAULT_LOCATIONS = [
  { id: 'l1', name: 'Cheras', address: 'Jalan Cerdas, Taman Connaught' },
  { id: 'l2', name: 'Petaling Jaya', address: 'Jalan Yong Shook Lin, PJ New Town' },
  { id: 'l3', name: 'Subang Jaya', address: 'Jalan SS 15/8' },
  { id: 'l4', name: 'Kuala Lumpur', address: 'Jalan Ampang' },
];

export async function ensureDefaultLocations(db) {
  for (const location of DEFAULT_LOCATIONS) {
    await db
      .prepare('INSERT OR IGNORE INTO locations (id, name, address) VALUES (?, ?, ?)')
      .bind(location.id, location.name, location.address || null)
      .run();
  }
}
