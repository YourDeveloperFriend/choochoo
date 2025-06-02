import { FormEvent, useCallback } from "react";
import { useTextInputState } from "../../utils/form_state";
import { useSubmitFeedback } from "./submit";
import { Button, Form, FormField } from "semantic-ui-react";

interface FeedbackFormProps {
  errorId?: number;
  onSubmit?: () => void;
}

export function FeedbackForm({ onSubmit, errorId }: FeedbackFormProps) {
  const [message, setMessage, setRawMessage] = useTextInputState();
  const { submitFeedback, validationError, isPending } = useSubmitFeedback();

  const onSubmitInternal = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      submitFeedback(
        { message, errorId, url: window.location.toString() },
        () => {
          setRawMessage("");
          onSubmit?.();
        },
      );
    },
    [message, errorId, submitFeedback],
  );

  return (
    <Form noValidate autoComplete="off" onSubmit={onSubmitInternal}>
      <FormField error={validationError?.message}>
        <Form.TextArea
          style={{ height: 200 }}
          placeholder="Submit message..."
          value={message}
          onChange={setMessage}
        />
      </FormField>
      <Button primary type="submit" disabled={isPending}>
        Submit
      </Button>
    </Form>
  );
}
