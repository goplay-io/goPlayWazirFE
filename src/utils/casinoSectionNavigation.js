export const CASINO_SECTION_LINK_TYPES = [
  'game',
  'provider',
  'provider_category',
  'category',
  'all',
];

export const isCasinoSectionLinkType = (type) => CASINO_SECTION_LINK_TYPES.includes(type);

export const isValidCasinoSectionItem = (item) => {
  if (!item || !isCasinoSectionLinkType(item.type)) return false;

  switch (item.type) {
    case 'game':
      return Boolean(item.gameId ?? item.game_id ?? item.id);
    case 'all':
      return true;
    case 'category':
      return Boolean(item.categoryName);
    case 'provider':
      return Boolean(item.providerName);
    case 'provider_category':
      return Boolean(item.providerName && item.categoryName);
    default:
      return false;
  }
};

const sectionItemTitle = (item) => {
  if (item.title) return item.title;
  if (item.type === 'game') return item.gameName || item.name || '';
  if (item.type === 'all') return 'All';
  if (item.type === 'category') return item.categoryName || '';
  if (item.type === 'provider') return item.providerName || '';
  if (item.type === 'provider_category') {
    return `${item.providerName || ''}${item.categoryName ? ` / ${item.categoryName}` : ''}`;
  }
  return item.name || '';
};

const sectionItemImage = (item) => item.imageUrl || item.url_thumb || item.imagePath || '';

/** Map public API section items to nav-ready slide objects. */
export const normalizeCasinoSectionNavItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => isValidCasinoSectionItem(item))
    .map((item) => {
      const name = sectionItemTitle(item);
      const url_thumb = sectionItemImage(item);

      if (item.type === 'game') {
        const gameId = String(item.gameId ?? item.game_id ?? item.id ?? '');
        return {
          navType: 'game',
          id: gameId,
          gameId,
          name,
          url_thumb,
        };
      }

      if (item.type === 'all') {
        return {
          navType: 'all',
          id: item.id ? String(item.id) : 'all',
          name,
          url_thumb,
        };
      }

      if (item.type === 'category') {
        return {
          navType: 'globalCategory',
          id: item.id ? String(item.id) : String(item.categoryName || ''),
          categoryName: item.categoryName || '',
          name,
          url_thumb,
        };
      }

      if (item.type === 'provider') {
        return {
          navType: 'provider',
          id: item.providerId != null ? String(item.providerId) : String(item.providerName || item.id || ''),
          providerName: item.providerName || '',
          name,
          url_thumb,
        };
      }

      return {
        navType: 'category',
        id: item.id ? String(item.id) : `${item.providerName}-${item.categoryName}`,
        providerName: item.providerName || '',
        categoryName: item.categoryName || '',
        name,
        url_thumb,
      };
    });
};

export const buildCasinoSectionRoute = (item, { casinoHomeRoute = 'casino-home', casinoGameRoute = 'casino-game' } = {}) => {
  if (!item?.navType) return null;

  if (item.navType === 'game') {
    if (!item.gameId) return null;
    return { name: casinoGameRoute, params: { gameId: item.gameId } };
  }

  if (item.navType === 'all') {
    return { name: casinoHomeRoute };
  }

  if (item.navType === 'provider') {
    if (!item.providerName) return null;
    return { name: casinoHomeRoute, query: { provider: item.providerName } };
  }

  if (item.navType === 'globalCategory') {
    if (!item.categoryName) return { name: casinoHomeRoute };
    return { name: casinoHomeRoute, query: { type: item.categoryName } };
  }

  if (item.navType === 'category') {
    if (!item.providerName) return null;
    return {
      name: casinoHomeRoute,
      query: {
        provider: item.providerName,
        type: item.categoryName || '',
      },
    };
  }

  return null;
};

export const pushCasinoSectionNavItem = (router, item, options = {}) => {
  const route = buildCasinoSectionRoute(item, options);
  if (!route) return false;

  if (item.navType === 'game' && options.setSelectedGame) {
    options.setSelectedGame({
      id: item.gameId,
      game_id: String(item.gameId),
      name: item.name || 'Casino game',
    });
  }

  router.push(route);
  return true;
};
