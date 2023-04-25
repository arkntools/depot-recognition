// @ts-expect-error dependency conflict
import type { Remote } from 'comlink';
import type { DeportRecognizer } from '../lib';

export type RemoteDeportRecognizer = Remote<DeportRecognizer>;
export type DepotRecognitionWrap = RemoteDeportRecognizer;

export default class DepotRecognitionWorker {
  DeportRecognizer!: new (
    ...args: ConstructorParameters<typeof DeportRecognizer>
  ) => Promise<RemoteDeportRecognizer>;
}
