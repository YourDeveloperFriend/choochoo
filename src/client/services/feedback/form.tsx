import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';
import { Box, Button, FormControl, FormHelperText } from "@mui/material";
import { styled } from '@mui/system';
import { FormEvent, useCallback } from "react";
import { useTextInputState } from "../../utils/form_state";
import { useSubmitFeedback } from "./submit";

const blue = {
  100: '#DAECFF',
  200: '#b6daff',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5',
  900: '#003A75',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const TextareaAutosize = styled(BaseTextareaAutosize)(
  ({ theme }) => `
  box-sizing: border-box;
  width: 320px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  padding: 8px 12px;
  border-radius: 8px;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  box-shadow: 0 2px 2px ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};

  &:hover {
    border-color: ${blue[400]};
  }

  &:focus {
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
  }

  /* firefox */
  &:focus-visible {
    outline: 0;
  }
`,
);

interface FeedbackFormProps {
  errorId?: number;
  onSubmit?: () => void;
}

export function FeedbackForm({ onSubmit, errorId }: FeedbackFormProps) {
  const [message, setMessage, setRawMessage] = useTextInputState();
  const { submitFeedback, validationError, isPending } = useSubmitFeedback();

  const onSubmitInternal = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitFeedback({ message, errorId, url: window.location.toString() }, () => {
      setRawMessage('');
      onSubmit?.();
    });
  }, [message, errorId, submitFeedback]);

  return <Box
    component="form"
    sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
    noValidate
    autoComplete="off"
    onSubmit={onSubmitInternal}
  >
    <FormControl sx={{ m: 1, minWidth: 80 }} error={validationError?.message != null}>
      <TextareaAutosize aria-label="Submit message..." style={{ height: 200 }} placeholder="Submit message..." value={message} onChange={setMessage} />
      {validationError?.message && <FormHelperText>{validationError?.message}</FormHelperText>}
    </FormControl>
    <div>
      <Button type="submit" disabled={isPending}>Submit</Button>
    </div>
  </Box >;
}