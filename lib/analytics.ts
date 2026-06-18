import analytics from '@react-native-firebase/analytics';

const log = async (name: string, params?: Record<string, string | number | boolean>) => {
  try {
    await analytics().logEvent(name, params);
  } catch {
    // analytics errors shouldn't crash the app
  }
};

export const Analytics = {
  screenView: (screenName: string) =>
    analytics()
      .logScreenView({ screen_name: screenName, screen_class: screenName })
      .catch(() => {}),

  selectDate: (date: string, daysFromToday: number) =>
    log('select_date', { date, days_from_today: daysFromToday }),

  sortChange: (sortMode: 'time' | 'distance') =>
    log('sort_change', { sort_mode: sortMode }),

  layoutChange: (layoutMode: string) =>
    log('layout_change', { layout_mode: layoutMode }),

  filterOpen: () => log('filter_open'),

  filterApply: (theaterCount: number, movieCount: number) =>
    log('filter_apply', { theater_count: theaterCount, movie_count: movieCount }),

  filterReset: () => log('filter_reset'),

  movieDetailView: (movieTitle: string, theater: string, movieTime: string) =>
    log('movie_detail_view', { movie_title: movieTitle, theater, movie_time: movieTime }),

  wishlistAdd: (movieTitle: string, theater: string) =>
    log('wishlist_add', { movie_title: movieTitle, theater }),

  wishlistRemove: (movieTitle: string, theater: string) =>
    log('wishlist_remove', { movie_title: movieTitle, theater }),

  bookingClick: (movieTitle: string, theater: string, movieTime: string) =>
    log('booking_click', { movie_title: movieTitle, theater, movie_time: movieTime }),

  bookingSuccess: (movieTitle: string, theater: string) =>
    log('booking_success', { movie_title: movieTitle, theater }),

  bookingFail: (movieTitle: string, theater: string) =>
    log('booking_fail', { movie_title: movieTitle, theater }),

  shareClick: (movieTitle: string, theater: string) =>
    log('share_click', { movie_title: movieTitle, theater }),

  wishlistViewMode: (mode: string) =>
    log('wishlist_view_mode', { mode }),

  wishlistClearAll: (count: number) =>
    log('wishlist_clear_all', { count }),

  wishlistCalendarSelect: (date: string) =>
    log('wishlist_calendar_select', { date }),
};
