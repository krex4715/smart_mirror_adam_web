import PocketBase from "pocketbase";

export const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
export const pb = new PocketBase(BASE_URL);

pb.autoCancellation(false);

// 로그인 상태가 로컬스토리지에 자동 보존됨
// (pb.authStore.save == true 기본값)
