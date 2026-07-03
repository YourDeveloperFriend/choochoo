import React, { useCallback, useState } from "react";

import { useGame } from "../services/game";
import {
  Button,
  Header,
  Modal,
  ModalActions,
  ModalContent,
  TextArea,
} from "semantic-ui-react";
import { tsr } from "../services/client";
import { handleError } from "../services/network";
import { Notes } from "../../api/notes";

function getNotesQueryKey(gameId: number) {
  return ["notes", gameId];
}

function useNotes(gameId: number): Notes {
  const { data } = tsr.notes.get.useSuspenseQuery({
    queryKey: getNotesQueryKey(gameId),
    queryData: { params: { gameId } },
  });

  return data.body;
}

function useSetNotes(gameId: number, onSuccess: () => void) {
  const tsrQueryClient = tsr.useQueryClient();
  const { mutate, error, isPending } = tsr.notes.set.useMutation();
  const validationError = handleError(isPending, error);

  const setNotes = useCallback(
    (body: Notes) => {
      mutate(
        { params: { gameId }, body: body },
        {
          onSuccess: () => {
            tsrQueryClient.notes.get.setQueryData(
              getNotesQueryKey(gameId),
              (r) => r && { ...r, status: 200, body },
            );
            onSuccess();
          },
        },
      );
    },
    [mutate, gameId, tsrQueryClient],
  );

  return { setNotes, isPending, validationError };
}

export function GameNotesButton() {
  const game = useGame();
  const notes = useNotes(game.id);
  const [open, setOpen] = useState<boolean>(!!notes.notes);
  const [notesDraft, setNotesDraft] = useState<string>(notes.notes);
  const { setNotes, isPending } = useSetNotes(game.id, () => setOpen(false));

  const openWithLatestNotes = useCallback(() => {
    setNotesDraft(notes.notes);
    setOpen(true);
  }, [notes.notes]);

  return (
    <>
      <Modal closeIcon open={open} onClose={() => setOpen(false)}>
        <Header>Game Notes</Header>
        <ModalContent>
          <TextArea
            style={{ width: "100%", height: "8em" }}
            value={notesDraft}
            onChange={(_, data) => setNotesDraft(data.value as string)}
          />
          <p>
            Notes written here are not visible to any other players. They will
            automatically be shown when returning to this game.
          </p>
        </ModalContent>
        <ModalActions>
          <Button
            primary
            onClick={() => {
              setNotes({ notes: notesDraft });
            }}
            disabled={isPending}
          >
            Save
          </Button>
        </ModalActions>
      </Modal>
      <Button onClick={openWithLatestNotes}>Game Notes</Button>
    </>
  );
}
