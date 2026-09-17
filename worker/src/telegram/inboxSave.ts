import type { Env } from "../env";
import { saveUserPhoto } from "../photos/service";
import { reviewUserPhoto } from "../photos/review";

export async function saveInboxPhotoToUser(
  env: Env,
  userId: string,
  bytes: ArrayBuffer,
  mime: string
) {
  const type = mime || "image/jpeg";
  const file = new File([bytes], "photo.jpg", { type });
  const photo = await saveUserPhoto(env, userId, file);
  const object = await env.PHOTOS.get(photo.r2_key);
  if (object) {
    await reviewUserPhoto(env, photo, await object.arrayBuffer()).catch(() => undefined);
  }
  return photo;
}
