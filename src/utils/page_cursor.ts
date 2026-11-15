export function parsePageCursor(pageCursor: string): number[];
export function parsePageCursor(pageCursor: undefined): undefined;
export function parsePageCursor(
  pageCursor: undefined | string,
): undefined | number[];
export function parsePageCursor(
  pageCursor: string | undefined,
): number[] | undefined {
  if (pageCursor == null) {
    return undefined;
  }
  return pageCursor.split(",").map(Number);
}

export function pageCursorToString(ids: number[]): string;
export function pageCursorToString(ids: undefined): undefined;
export function pageCursorToString(
  ids: number[] | undefined,
): string | undefined;
export function pageCursorToString(
  ids: number[] | undefined,
): string | undefined {
  if (ids == null) {
    return undefined;
  }
  return ids.join(",");
}
