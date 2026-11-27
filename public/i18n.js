// Übersetzt nur die Oberfläche. Inhalte von BeatSaver (Titel, Künstler, Mapper) bleiben unverändert.
(() => {
  const D = {
    de: {
      page_title: 'Beat Saber Wunschliste',
      heading: 'Beat Saber Wunschliste',
      lang_label: 'Sprache',
      search_ph: 'Song, Künstler oder Mapper suchen',
      search_label: 'Suche',
      sort_label: 'Sortierung',
      sort_Latest: 'Neueste',
      sort_Rating: 'Beste Bewertung',
      sort_Curated: 'Kuratiert',
      sort_Relevance: 'Relevanz',
      status_loading: 'Lade Status …',
      status_ready: 'Dein Wunsch landet im Chat von {channel}.',
      status_not_ready: 'Der Dienst ist noch nicht eingerichtet, Wünsche sind gerade nicht möglich.',
      empty: 'Keine Maps gefunden. Probier einen anderen Suchbegriff.',
      load_more: 'Mehr laden',
      request: 'Wünschen',
      sending: 'Sende …',
      requested: 'Gewünscht',
      sent_toast: '„{name}“ wurde in den Chat geschickt',
      by_mapper: 'Map von {mapper}',
      positive: '{n} % positiv',
      preview: 'Vorschau abspielen: {name}',
      preview_failed: 'Die Vorschau konnte nicht abgespielt werden.',
      nav_label: 'Ansicht',
      tab_maps: 'Maps',
      tab_history: 'Verlauf',
      empty_history: 'Noch keine Wünsche.',
      requested_at: 'Gewünscht am {when}',
      no_details: 'Keine Details verfügbar',

      admin_page_title: 'Admin · Beat Saber Wunschliste',
      admin_heading: 'Einstellungen',
      to_list: 'Zur Wunschliste',
      login_heading: 'Anmelden',
      login_btn: 'Anmelden',
      admin_pw: 'Admin-Passwort',
      sec_twitch: 'Twitch-Account',
      state_label: 'Status:',
      not_connected: 'Nicht verbunden',
      connected_as: 'Verbunden als {login}',
      client_id: 'Twitch Client-ID',
      client_hint: 'Erstelle eine App auf <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noopener">dev.twitch.tv/console</a> mit Client-Typ „Öffentlich“ (Public). Als OAuth-Weiterleitungs-URL reicht <code>http://localhost</code>.',
      connect: 'Mit Twitch verbinden',
      reconnect: 'Neu verbinden',
      disconnect: 'Trennen',
      device_pre: 'Öffne',
      device_link: 'die Twitch-Freigabeseite',
      device_post: ', melde dich mit dem Account an, der schreiben soll, und gib diesen Code ein:',
      device_waiting: 'Warte auf Freigabe …',
      device_expired: 'Der Code ist abgelaufen. Bitte neu starten.',
      sec_chat: 'Chat und Limits',
      channel: 'Ziel-Kanal',
      message: 'Nachricht',
      message_hint: '<code>{code}</code> wird durch den BeatSaver-Code ersetzt.',
      ip_cd: 'Wartezeit pro Gast (Sekunden)',
      map_cd: 'Wartezeit pro Map (Sekunden)',
      default_lang: 'Standardsprache',
      default_lang_hint: 'Gilt für alle Gäste, die noch keine Sprache gewählt haben.',
      save: 'Speichern',
      saved: 'Gespeichert',
      logout: 'Abmelden',

      'err.network': 'Keine Verbindung zum Server.',
      'err.internal_error': 'Interner Fehler.',
      'err.external_unreachable': 'Ein externer Dienst (BeatSaver oder Twitch) ist nicht erreichbar.',
      'err.not_logged_in': 'Bitte neu anmelden.',
      'err.too_many_attempts': 'Zu viele Versuche, bitte später erneut probieren.',
      'err.wrong_password': 'Falsches Passwort.',
      'err.bad_channel': 'Ungültiger Kanalname.',
      'err.bad_template': 'Die Nachricht muss {code} enthalten (max. 200 Zeichen).',
      'err.bad_cooldown': 'Wartezeiten müssen zwischen 0 und 86400 Sekunden liegen.',
      'err.need_client_id': 'Bitte zuerst die Client-ID speichern.',
      'err.twitch_login_rejected': 'Twitch hat den Login abgelehnt (Client-ID korrekt?) {detail}',
      'err.token_check_failed': 'Das Token konnte nicht geprüft werden.',
      'err.twitch_error': 'Twitch-Fehler: {detail}',
      'err.login_expired': 'Der Twitch-Login ist abgelaufen. Bitte im Admin-Bereich neu verbinden.',
      'err.twitch_not_connected': 'Twitch ist nicht verbunden.',
      'err.channel_not_found': 'Twitch-Kanal „{channel}“ nicht gefunden.',
      'err.twitch_rejected': 'Twitch hat die Nachricht abgelehnt. {detail}',
      'err.twitch_dropped': 'Twitch hat die Nachricht verworfen. {detail}',
      'err.beatsaver_down': 'BeatSaver antwortet gerade nicht.',
      'err.invalid_code': 'Ungültiger Map-Code.',
      'err.not_setup': 'Der Dienst ist noch nicht eingerichtet.',
      'err.wait_ip': 'Bitte warte noch {s} Sekunden.',
      'err.wait_map': 'Diese Map wurde gerade erst gewünscht.',
    },
    en: {
      page_title: 'Beat Saber Requests',
      heading: 'Beat Saber Requests',
      lang_label: 'Language',
      search_ph: 'Search song, artist or mapper',
      search_label: 'Search',
      sort_label: 'Sort by',
      sort_Latest: 'Newest',
      sort_Rating: 'Top rated',
      sort_Curated: 'Curated',
      sort_Relevance: 'Relevance',
      status_loading: 'Loading status …',
      status_ready: 'Your request goes to the chat of {channel}.',
      status_not_ready: 'The service is not set up yet, so requests are not possible right now.',
      empty: 'No maps found. Try a different search term.',
      load_more: 'Load more',
      request: 'Request',
      sending: 'Sending …',
      requested: 'Requested',
      sent_toast: '“{name}” was sent to the chat',
      by_mapper: 'Mapped by {mapper}',
      positive: '{n}% positive',
      preview: 'Play preview: {name}',
      preview_failed: 'The preview could not be played.',
      nav_label: 'View',
      tab_maps: 'Maps',
      tab_history: 'History',
      empty_history: 'No requests yet.',
      requested_at: 'Requested on {when}',
      no_details: 'No details available',

      admin_page_title: 'Admin · Beat Saber Requests',
      admin_heading: 'Settings',
      to_list: 'Back to requests',
      login_heading: 'Sign in',
      login_btn: 'Sign in',
      admin_pw: 'Admin password',
      sec_twitch: 'Twitch account',
      state_label: 'Status:',
      not_connected: 'Not connected',
      connected_as: 'Connected as {login}',
      client_id: 'Twitch client ID',
      client_hint: 'Create an app at <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noopener">dev.twitch.tv/console</a> with client type “Public”. <code>http://localhost</code> is enough as the OAuth redirect URL.',
      connect: 'Connect to Twitch',
      reconnect: 'Reconnect',
      disconnect: 'Disconnect',
      device_pre: 'Open',
      device_link: 'the Twitch activation page',
      device_post: ', sign in with the account that should post, and enter this code:',
      device_waiting: 'Waiting for approval …',
      device_expired: 'The code has expired. Please start again.',
      sec_chat: 'Chat and limits',
      channel: 'Target channel',
      message: 'Message',
      message_hint: '<code>{code}</code> is replaced with the BeatSaver code.',
      ip_cd: 'Cooldown per guest (seconds)',
      map_cd: 'Cooldown per map (seconds)',
      default_lang: 'Default language',
      default_lang_hint: 'Applies to all guests who have not picked a language yet.',
      save: 'Save',
      saved: 'Saved',
      logout: 'Sign out',

      'err.network': 'Cannot reach the server.',
      'err.internal_error': 'Internal error.',
      'err.external_unreachable': 'An external service (BeatSaver or Twitch) is unreachable.',
      'err.not_logged_in': 'Please sign in again.',
      'err.too_many_attempts': 'Too many attempts, please try again later.',
      'err.wrong_password': 'Wrong password.',
      'err.bad_channel': 'Invalid channel name.',
      'err.bad_template': 'The message must contain {code} (max. 200 characters).',
      'err.bad_cooldown': 'Cooldowns must be between 0 and 86400 seconds.',
      'err.need_client_id': 'Please save the client ID first.',
      'err.twitch_login_rejected': 'Twitch rejected the login (is the client ID correct?) {detail}',
      'err.token_check_failed': 'The token could not be verified.',
      'err.twitch_error': 'Twitch error: {detail}',
      'err.login_expired': 'The Twitch login has expired. Please reconnect in the admin area.',
      'err.twitch_not_connected': 'Twitch is not connected.',
      'err.channel_not_found': 'Twitch channel “{channel}” not found.',
      'err.twitch_rejected': 'Twitch rejected the message. {detail}',
      'err.twitch_dropped': 'Twitch dropped the message. {detail}',
      'err.beatsaver_down': 'BeatSaver is not responding right now.',
      'err.invalid_code': 'Invalid map code.',
      'err.not_setup': 'The service is not set up yet.',
      'err.wait_ip': 'Please wait {s} more seconds.',
      'err.wait_map': 'This map was just requested.',
    },
  };

  let lang = 'en';
  const listeners = [];

  const t = (key, params = {}) =>
    String(D[lang][key] ?? D.de[key] ?? key)
      .replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m))
      .trim();

  // Fehlerobjekt vom Server ({ code, params }) in einen lesbaren Text umwandeln
  const errMsg = (e) => (e && e.code ? t('err.' + e.code, e.params) : t('err.network'));

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    document.querySelectorAll('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }

  function setLang(l) {
    if (!D[l]) return;
    lang = l;
    try { localStorage.setItem('lang', l); } catch { /* Speicher gesperrt */ }
    apply();
    listeners.forEach((fn) => fn(l));
  }

  async function init() {
    let stored = null;
    try { stored = localStorage.getItem('lang'); } catch { /* ignorieren */ }
    if (D[stored]) lang = stored;
    else {
      const s = await fetch('/api/status').then((r) => r.json()).catch(() => ({}));
      if (D[s.defaultLang]) lang = s.defaultLang;
    }
    document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    apply();
  }

  window.i18n = { t, errMsg, init, setLang, onChange: (fn) => listeners.push(fn), get lang() { return lang; } };
})();
