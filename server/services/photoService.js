import { Photo } from '../models/Photo.js';
import { User } from '../models/User.js';
import { validateAndParsePhoto } from '../utils/photoValidator.js';

/**
 * Saves a new photo in the dedicated MongoDB photos collection and
 * deletes any previous custom photos for this user to avoid orphan records.
 * Returns the stable photo reference URL (e.g. `/api/photos/${photo._id}`).
 */
export async function saveUserPhoto(userId, photoData) {
  const { buffer, contentType, size } = validateAndParsePhoto(photoData);

  // Clean up any existing custom photos for this user
  await Photo.deleteMany({ userId });

  const photo = new Photo({
    userId,
    data: buffer,
    contentType,
    size
  });

  await photo.save();

  const photoUrl = `/api/photos/${photo._id}`;
  return { photo, photoUrl };
}

/**
 * Removes custom photos for a user and resets user avatar to the default silhouette.
 */
export async function deleteUserPhoto(userId) {
  await Photo.deleteMany({ userId });
  await User.findByIdAndUpdate(userId, {
    avatar: './avatars/default_avatar.svg'
  });
}

