import * as wallet from './wallet';
import * as paymentMethods from './paymentMethods';

export default {
  ...wallet,
  ...paymentMethods,
};

export * from './wallet';
export * from './paymentMethods';