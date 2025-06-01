import { MoveData } from "./move";

export interface InterceptMoveModalProps {
  cityName?: string;
  moveData?: MoveData;
  clearMoveData(): void;
}

export class MoveInterceptor {
  public shouldInterceptMove(_moveData: MoveData, _cityName: string): boolean {
    return false;
  }
}
