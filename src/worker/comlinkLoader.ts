// @ts-expect-error
import { Remote } from 'comlink';
import { DeportRecognizer } from '../lib';

export type RemoteDeportRecognizer = Remote<DeportRecognizer>;
export type DepotRecognitionWrap = RemoteDeportRecognizer;

export default class DepotRecognitionWorker {
  DeportRecognizer!: new (
    ...args: ConstructorParameters<typeof DeportRecognizer>
  ) => Promise<RemoteDeportRecognizer>;
}
