import { initContract } from "@ts-rest/core";
import z from "zod";

const c = initContract();

const Notes = z.object({
  notes: z.string(),
});
export type Notes = z.infer<typeof Notes>;

export const notesContract = c.router({
  get: {
    method: "GET",
    pathParams: z.object({ gameId: z.coerce.number() }),
    path: "/games/:gameId/notes",
    responses: {
      200: Notes,
    },
    summary: "Gets the notes for the current user",
  },
  set: {
    method: "PUT",
    pathParams: z.object({ gameId: z.coerce.number() }),
    body: Notes,
    path: "/games/:gameId/notes",
    responses: {
      200: Notes,
    },
    summary: "Sets the notes for the current user",
  },
});
