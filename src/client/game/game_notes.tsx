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

function useNotes(gameId: number): Notes {
  const { data } = tsr.notes.get.useSuspenseQuery({
    queryKey: ["notes", gameId],
    queryData: { params: { gameId } },
  });

  return data.body;
}

function useSetNotes(gameId: number, onSuccess: () => void) {
  const { mutate, error, isPending } = tsr.notes.set.useMutation();
  const validationError = handleError(isPending, error);

  const setNotes = useCallback(
    (body: Notes) => {
      mutate(
        { params: { gameId }, body: body },
        {
          onSuccess: () => onSuccess(),
        },
      );
    },
    [mutate, gameId],
  );

  return { setNotes, isPending, validationError };
}

export function GameNotesButton() {
  const game = useGame();
  const notes = useNotes(game.id);
  const [open, setOpen] = useState<boolean>(!!notes.notes);
  const [notesDraft, setNotesDraft] = useState<string>(notes.notes);
  const { setNotes, isPending } = useSetNotes(game.id, () => setOpen(false));

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
      <Button onClick={() => setOpen(true)}>Game Notes</Button>
    </>
  );
}
