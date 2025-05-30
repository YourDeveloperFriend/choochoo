import { ChangeEvent, SyntheticEvent, useCallback, useState } from "react";
import { CheckboxProps, DropdownProps } from "semantic-ui-react";
import { FormNumber } from "../../utils/types";

export function useSemanticUiCheckboxState(
  initialValue = false,
): [
  boolean,
  (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => void,
] {
  const [state, setState] = useState(initialValue);
  return [
    state,
    useCallback((e, data) => setState(!!data.checked), [setState]),
  ];
}

export function useCheckboxState(
  initialValue = false,
): [boolean, (e: ChangeEvent<HTMLInputElement>) => void] {
  const [state, setState] = useState(initialValue);
  return [state, useCallback((e) => setState(e.target.checked), [setState])];
}

export function useTextInputState(
  initialValue = "",
): [
  string,
  (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  (value: string) => void,
] {
  const [state, setState] = useState(initialValue);
  return [
    state,
    useCallback((e) => setState(e.target.value), [setState]),
    setState,
  ];
}

export function useNumberInputState(
  initialValue: FormNumber,
): [
  FormNumber,
  (e: ChangeEvent<HTMLInputElement>) => void,
  (value: FormNumber) => void,
] {
  const [state, setState] = useState(initialValue);
  return [
    state,
    useCallback(
      (e) =>
        setState(isNaN(e.target.valueAsNumber) ? "" : e.target.valueAsNumber),
      [setState],
    ),
    setState,
  ];
}

export function useSemanticSelectState<T>(
  initialValue: T,
): [T, (e: SyntheticEvent, data: DropdownProps) => void, (value: T) => void] {
  const [state, setState] = useState(initialValue);
  return [
    state,
    useCallback((_, data) => setState(data.value as T), [setState]),
    setState,
  ];
}
