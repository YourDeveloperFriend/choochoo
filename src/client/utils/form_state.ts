import {SelectChangeEvent} from "@mui/material";
import * as React from "react";
import {ChangeEvent, useCallback, useState} from "react";
import {FormNumber} from "../../utils/types";
import {CheckboxProps} from "semantic-ui-react/dist/commonjs/modules/Checkbox/Checkbox";

export function useSemanticUiCheckboxState(
    initialValue = false,
): [boolean, (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => void] {
  const [state, setState] = useState(initialValue);
  return [state, useCallback((e, data) => setState(!!data.checked), [setState])];
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

export function useSelectState<T>(
  initialValue: T,
): [T, (e: SelectChangeEvent<T>) => void, (value: T) => void] {
  const [state, setState] = useState(initialValue);
  return [
    state,
    useCallback((e) => setState(e.target.value as T), [setState]),
    setState,
  ];
}
