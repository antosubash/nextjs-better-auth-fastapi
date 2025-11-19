import { z } from "zod";
import { API_KEY_ERRORS } from "@/lib/constants";

export const apiKeySchema = z
  .object({
    name: z.string().optional(),
    prefix: z.string().optional(),
    expiresIn: z.string().optional(),
    metadata: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.expiresIn && data.expiresIn.trim() !== "") {
        const days = parseInt(data.expiresIn, 10);
        return !Number.isNaN(days) && days >= 0;
      }
      return true;
    },
    {
      message: API_KEY_ERRORS.INVALID_EXPIRATION,
      path: ["expiresIn"],
    }
  )
  .refine(
    (data) => {
      if (data.metadata && data.metadata.trim() !== "") {
        try {
          JSON.parse(data.metadata);
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: API_KEY_ERRORS.INVALID_METADATA,
      path: ["metadata"],
    }
  );

export type ApiKeyFormValues = z.infer<typeof apiKeySchema>;
