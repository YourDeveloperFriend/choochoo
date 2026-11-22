import { z, ZodIssue } from "zod";

function assumeIsZodIssue(_t: unknown): _t is ZodIssue {
  return true;
}

export const ZodErrorResponse = z.object({
  name: z.literal("ZodError"),
  issues: z.unknown().refine(assumeIsZodIssue).array(),
});

export type ZodErrorResponse = z.infer<typeof ZodErrorResponse>;

export type ValidationError = Record<string, string>;
