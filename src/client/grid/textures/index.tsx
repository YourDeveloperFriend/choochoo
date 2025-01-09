import { Texture, TextureType } from "../../../engine/state/texture";
import { assertNever } from "../../../utils/validate";
import { Point } from "../point";
import { RiverTextureRender } from "./river";

interface TextureProps {
  texture: Texture;
  center: Point;
  size: number;
}

export function TextureRender(props: TextureProps) {
  switch (props.texture.type) {
    case TextureType.RIVER:
      return <RiverTextureRender {...props} />;
    default:
      assertNever(props.texture.type);
  }
}