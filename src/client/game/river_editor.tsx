import { ChangeEvent, useCallback, useMemo, useState } from "react";
import * as mapStyles from "../grid/hex.module.css";
import { Point } from "../../utils/point";
import * as React from "react";
import * as hexGridStyles from "../grid/hex_grid.module.css";

export type RiverPath = {
  absolute: boolean;
  path: Point[];
};

export function River({ path }: { path?: RiverPath }) {
  const dValue = useMemo(() => toDValue(path), [path]);
  if (dValue === "") return <></>;
  return <path className={mapStyles.riverPath} d={dValue} />;
}

interface RiverEditorProps {
  path?: RiverPath;
  setRiverPath: (path?: RiverPath) => void;
}

interface Dragging {
  index: number;
  startDocument: Point;
  startCircle: Point;
}

export function RiverDots({ path, setRiverPath }: RiverEditorProps) {
  const [dragging, setDragging] = useState<Dragging | undefined>();
  React.useEffect(() => {
    if (dragging == null) return;
    const mousemove = (e: MouseEvent) => {
      setRiverPath({
        absolute: path!.absolute,
        path: path!.path
          .slice(0, dragging.index)
          .concat([
            {
              x:
                dragging.startCircle.x + (e.clientX - dragging.startDocument.x),
              y:
                dragging.startCircle.y + (e.clientY - dragging.startDocument.y),
            },
          ])
          .concat(path!.path.slice(dragging.index + 1)),
      });
    };
    const mouseup = () => {
      setDragging(undefined);
    };
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
    return () => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);
    };
  }, [dragging != null]);
  const onClick = useCallback(
    (e: React.MouseEvent<SVGCircleElement>) => {
      const target = e.target as SVGCircleElement;
      const index = Number(target.dataset["i"]);
      if (typeof index != "number" || isNaN(index)) return;
      setDragging({
        index,
        startDocument: {
          x: e.clientX,
          y: e.clientY,
        },
        startCircle: {
          x: parseFloat(target.getAttribute("cx")!),
          y: parseFloat(target.getAttribute("cy")!),
        },
      });
    },
    [setDragging],
  );
  return (
    <>
      {path?.path.map(({ x, y }, i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={5}
          data-i={i}
          className={hexGridStyles.clickable}
          onMouseDown={onClick}
        />
      ))}
    </>
  );
}

export function RiverEditor({ path, setRiverPath }: RiverEditorProps) {
  const internalSetRiverPath = useCallback(
    (value: string) => {
      setRiverPath(parseRiverPath(value));
    },
    [setRiverPath],
  );
  const toggleAbsolute = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (path == null) return;
      const newAbsolute = e.target.checked;
      if (newAbsolute === path.absolute) return;
      const newPath = [path.path[0]];
      for (const { x, y } of path.path.slice(1)) {
        if (newAbsolute) {
          const recent = newPath[Math.floor((newPath.length - 1) / 3) * 3];
          newPath.push({ x: recent.x + x, y: recent.y + y });
        } else {
          const recent = path.path[Math.floor((newPath.length - 1) / 3) * 3];
          newPath.push({ x: x - recent.x, y: y - recent.y });
        }
      }
      setRiverPath({
        path: newPath,
        absolute: newAbsolute,
      });
    },
    [setRiverPath, path],
  );
  return (
    <>
      <input
        type="text"
        value={toDValue(path)}
        size={100}
        onChange={(e) => internalSetRiverPath(e.target.value)}
      />
      <input
        type="checkbox"
        checked={path?.absolute ?? false}
        onChange={toggleAbsolute}
      />
    </>
  );
}

function parseRiverPath(value: string): RiverPath | undefined {
  if (value === "") {
    return undefined;
  }
  const absolute = value.includes("C");
  if (value.startsWith("m ")) {
    value = value.slice(2);
  } else {
    throw new Error("Invalid river path");
  }
  const [mValue, cValue] = value.split(/C/i);
  if (cValue == null) {
    throw new Error("Invalid river path");
  }
  const riverPath: Point[] = [mValue, ...cValue.trim().split(" ")].map((v) => {
    const [x, y] = v.trim().split(",");
    return { x: parseFloat(x), y: parseFloat(y) };
  });
  return { path: riverPath, absolute };
}

function toDValue(path?: RiverPath): string {
  if (path == null) return "";
  const [first, ...rest] = path.path;
  if (rest.length === 0) return "";
  return `m ${first.x},${first.y} ${path.absolute ? "C" : "c"} ${rest.map(({ x, y }) => `${x},${y}`).join(" ")}`;
}
