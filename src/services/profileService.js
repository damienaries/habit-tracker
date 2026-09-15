import { db } from '../db/habitDb';

// Profiles are local to this device — one per person sharing it. This is not
// authentication and does not pretend to be: anyone using the device can pick
// any profile. Real accounts would sit in front of this, not replace it.
export async function listProfiles() {
	return await db.users.toArray();
}

export async function getProfile(id) {
	return await db.users.get(Number(id));
}
