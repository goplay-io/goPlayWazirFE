/**
 * Account drawer nav — grouped to match monkeydon.com reference sections.
 * Items keep existing routes/actions used by Header / GuestLayout handlers.
 */
export const USER_DRAWER_NAV_SECTIONS = [
  {
    id: 'help',
    titleKey: 'header.user.drawer.sections.help',
    items: [
      {
        title: 'header.user.drawer.customerSupport',
        icon: 'mdi-whatsapp',
        action: 'customer-support',
      },
      {
        title: 'header.user.drawer.downloadApk',
        icon: 'mdi-download',
        action: 'download-apk',
      },
    ],
  },
  {
    id: 'statements',
    titleKey: 'header.user.drawer.sections.statements',
    items: [
      {
        title: 'header.user.drawer.openBets',
        icon: 'mdi-star-outline',
        to: '/unsettled-bets',
      },
      {
        title: 'header.user.menu.profitLoss',
        icon: 'mdi-chart-line',
        to: '/profit-loss',
      },
      {
        title: 'header.user.menu.accountStatement',
        icon: 'mdi-file-document-outline',
        to: '/account-statement',
      },
      {
        title: 'header.user.menu.depositTurnover',
        icon: 'mdi-swap-horizontal',
        to: '/deposit-turnovers',
      },
      {
        title: 'header.user.menu.turnoverHistory',
        icon: 'mdi-chart-areaspline',
        to: '/turnover-history',
      },
      {
        title: 'header.user.menu.bonusStatement',
        icon: 'mdi-gift-outline',
        to: '/bonus-statement',
      },
      {
        title: 'header.user.drawer.myBets',
        icon: 'mdi-history',
        to: '/bet-history',
      },
      {
        title: 'components.mobileBottomNav.affiliate',
        icon: 'mdi-account-outline',
        to: '/affiliate',
      },
      {
        title: 'header.bonuses',
        icon: 'mdi-gift-outline',
        to: '/bonuses',
      },
    ],
  },
  {
    id: 'settings',
    titleKey: 'header.user.drawer.sections.accountSettings',
    items: [
      {
        title: 'header.user.drawer.settings',
        icon: 'mdi-tune',
        to: '/buttons',
      },
      {
        title: 'header.user.menu.paymentMethods',
        icon: 'mdi-credit-card-outline',
        to: '/payment-methods',
      },
      {
        title: 'header.wallet',
        icon: 'mdi-wallet-outline',
        to: '/wallet',
      },
      {
        title: 'header.user.menu.favourite',
        icon: 'mdi-heart-outline',
        to: '/sports/multi-market',
      },
      {
        title: 'components.header.language',
        icon: 'mdi-translate',
        action: 'language',
      },
      {
        title: 'components.exposureDialog.title',
        icon: 'mdi-chart-box-outline',
        action: 'exposure',
      },
      {
        title: 'header.user.drawer.bonusRules',
        icon: 'mdi-text-box-outline',
        action: 'bonus-rules',
      },
    ],
  },
  {
    id: 'legal',
    titleKey: 'header.user.drawer.sections.legal',
    items: [
      {
        title: 'header.user.drawer.rules',
        icon: 'mdi-scale-balance',
        to: '/rules',
      },
    ],
  },
  {
    id: 'account-actions',
    titleKey: 'header.user.drawer.sections.accountActions',
    items: [
      {
        title: 'header.user.drawer.resetPassword',
        icon: 'mdi-lock-outline',
        to: '/change-password',
      },
      {
        title: 'header.user.drawer.logout',
        icon: 'mdi-logout',
        action: 'logout',
      },
    ],
  },
]

/** Flat list kept for any legacy consumers. */
export const USER_DRAWER_NAV_ITEMS = USER_DRAWER_NAV_SECTIONS.flatMap(
  (section) => section.items,
)
