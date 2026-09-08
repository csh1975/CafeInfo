import { z } from "zod";

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB (서버 재검증용)
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const cafeBaseSchema = z.object({
  name: z.string({ required_error: "카페명을 입력해주세요." }).trim().min(1, "카페명을 입력해주세요.").max(100, "카페명은 100자 이내로 입력해주세요."),
  address: z.string({ required_error: "주소를 입력해주세요." }).trim().min(1, "주소를 입력해주세요.").max(200, "주소는 200자 이내로 입력해주세요."),
  travelTime: z.coerce
    .number({ invalid_type_error: "소요시간은 숫자로 입력해주세요." })
    .int("소요시간은 분 단위 정수로 입력해주세요.")
    .min(0, "소요시간은 0분 이상이어야 합니다.")
    .max(1440, "소요시간은 1440분 이하로 입력해주세요."),
  rating: z.coerce
    .number({ invalid_type_error: "추천도를 선택해주세요." })
    .int("추천도는 1~5 사이의 정수여야 합니다.")
    .min(1, "추천도는 1 이상이어야 합니다.")
    .max(5, "추천도는 5 이하이어야 합니다."),
  description: z
    .string()
    .trim()
    .max(1000, "메모는 1000자 이내로 입력해주세요.")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export const cafeCreateSchema = cafeBaseSchema;
export const cafeUpdateSchema = cafeBaseSchema;

export type CafeInput = z.infer<typeof cafeBaseSchema>;

export const commentCreateSchema = z.object({
  nickname: z
    .string()
    .trim()
    .max(20, "닉네임은 20자 이내로 입력해주세요.")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  content: z
    .string({ required_error: "댓글 내용을 입력해주세요." })
    .trim()
    .min(1, "댓글 내용을 입력해주세요.")
    .max(500, "댓글은 500자 이내로 입력해주세요."),
  password: z
    .string({ required_error: "비밀번호를 입력해주세요." })
    .min(4, "비밀번호는 4자 이상이어야 합니다.")
    .max(32, "비밀번호는 32자 이내여야 합니다."),
});

export const commentDeleteSchema = z.object({
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export function validateImageFile(file: File | null | undefined): string | null {
  if (!file || file.size === 0) return null; // 선택 입력
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "이미지는 JPEG, PNG, WebP 형식만 업로드할 수 있습니다.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "이미지 크기는 1MB 이하이어야 합니다. 더 작게 압축해서 다시 시도해주세요.";
  }
  return null;
}
