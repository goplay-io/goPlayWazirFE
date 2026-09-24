const defaultEventBase = import.meta.env.VITE_EVENT_BASE;
const defaultUserBase = import.meta.env.VITE_USER_BASE;
const defaultReportBase = import.meta.env.VITE_REPORT_BASE;
const defaultWalletBase = import.meta.env.VITE_WALLET_BASE;

const serviceMap = {
  user: defaultUserBase,
  event: defaultEventBase,
  report: defaultReportBase,
  wallet: defaultWalletBase,
};

export default serviceMap;
