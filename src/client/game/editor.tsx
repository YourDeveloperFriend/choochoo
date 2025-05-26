import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { useConfirm } from "../components/confirm";
import { canEditGame, useGame, useSetGameData } from "../services/game";
import { useIsAdmin } from "../services/me";
import { Button, Icon } from "semantic-ui-react";

export function Editor() {
  const isAdmin = useIsAdmin();
  const game = useGame();
  const confirm = useConfirm();
  const canRead = isAdmin;
  const content = useMemo(() => {
    return JSON.stringify(JSON.parse(game.gameData!), null, 2);
  }, [game]);
  const [isOpen, setIsOpen] = useState(false);
  const [newContent, setNewContent] = useState({
    content,
    version: game.version,
  });
  const { setGameData, isPending } = useSetGameData();

  const canEdit = canEditGame(game) && !isPending;

  const setNewContentFromTextArea = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setNewContent({ content: e.target.value, version: game.version });
    },
    [setNewContent, game.version],
  );

  const actualContent =
    game.version > newContent.version ? content : newContent.content;

  const toggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  const submit = useCallback(async () => {
    const confirmed = await confirm(
      "Are you sure? This can seriously fuck up your game and there's no undo",
    );
    if (!confirmed) return;
    setGameData(JSON.stringify(JSON.parse(actualContent)));
  }, [confirm, actualContent, setGameData]);

  if (!canRead) return <></>;

  return (
    <>
      {isOpen ? (
        <Button icon labelPosition="left" basic color="blue" onClick={toggle}>
          <Icon name="close" />
          Close editor
        </Button>
      ) : (
        <Button icon labelPosition="left" basic color="blue" onClick={toggle}>
          <Icon name="code" />
          View Data
        </Button>
      )}

      {isOpen && (
        <textarea
          value={actualContent}
          onChange={setNewContentFromTextArea}
          disabled={!canEdit}
        />
      )}
      {isOpen && (
        <Button onClick={submit} disabled={!canEdit}>
          Submit
        </Button>
      )}
    </>
  );
}
