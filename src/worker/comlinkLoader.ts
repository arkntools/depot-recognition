import { DeportRecognizer } from '../lib';

type ComlinkWrap<T extends Record<string, any>> = {
  [Key in keyof T]: T[Key] extends (...args: any[]) => any
    ? ReturnType<T[Key]> extends Promise<any>
      ? T[Key]
      : (...args: Parameters<T[Key]>) => Promise<ReturnType<T[Key]>>
    : Promise<T[Key]>;
};

export type DepotRecognitionWrap = ComlinkWrap<DeportRecognizer>;

export default class DepotRecognitionWorker {
  DeportRecognizer!: new (
    ...args: ConstructorParameters<typeof DeportRecognizer>
  ) => Promise<DepotRecognitionWrap>;
}
