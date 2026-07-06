import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type Lang = "ru" | "en"

type Dict = Record<string, string>

const EN: Dict = {
  tagline: "Your Friday Night Funkin' video vault",
  search_placeholder: "Search funkin' videos, mods, charts...",
  search: "Search",
  upload: "Upload",
  your_channel: "Your channel",
  settings: "Settings",
  language: "Language",
  russian: "Russian",
  english: "English",
  done: "Done",
  cancel: "Cancel",
  save: "Save",
  saving: "Saving…",
  back: "Back",
  logout: "Log out",

  // Auth
  welcome_to: "Welcome to",
  welcome_sub: "Sign in or create an account to upload, comment and build your channel.",
  sign_in: "Sign in",
  sign_up: "Create account",
  name: "Name",
  email: "Email",
  password: "Password",
  log_in_btn: "Log in",
  create_btn: "Create account",
  no_account: "Don't have an account?",
  have_account: "Already have an account?",
  go_signup: "Sign up",
  go_signin: "Log in",
  err_fill_all: "Please fill in every field.",
  err_invalid_login: "Wrong email or password.",
  err_email_taken: "That email is already registered.",
  err_generic: "Something went wrong. Please try again.",
  name_ph: "Your name",
  email_ph: "you@example.com",
  password_ph: "Make up a password",

  // Sidebar
  home: "Home",
  trending: "Trending",
  subscriptions: "Subscriptions",
  you: "You",
  my_uploads: "My Uploads",
  library: "Library",
  liked_videos: "Liked videos",
  tip: "Upload a video and give it a title, tags and a thumbnail — it lands straight in your channel.",

  // Sections
  sec_your: "Your ",
  sec_top: "Top ",
  sec_liked: "Liked ",
  vault: "Vault",
  uploads: "Uploads",
  funkin: "Funkin'",
  subs_word: "Subscriptions",
  liked_word: "videos",
  library_word: "Library",
  sub_vault: "Videos you've uploaded",
  sub_uploads: "{n} in your vault",
  sub_trending: "Sorted by likes",
  sub_subs: "Latest uploads",
  sub_liked: "Your favourites",
  sub_library: "Everything in one place",

  // Empty states
  empty_conn_title: "Connection problem",
  empty_loading_title: "Loading your vault…",
  empty_loading_body: "Fetching videos from Supabase.",
  empty_liked_title: "No liked videos yet",
  empty_liked_body: "Open a video and tap Like to see it here.",
  empty_search_title: "No videos match your search",
  empty_search_body: "Try a different keyword.",
  empty_vault_title: "Your vault is empty",
  empty_vault_body: "Drop a video into the zone above to add your first clip.",

  // Upload zone
  dz_loading: "Loading your video...",
  dz_title: "Drop a video to upload",
  dz_body: "Drag & drop an MP4, WebM or MOV here, or browse your files.",
  dz_pick: "Select video",
  dz_hint: "or drop it anywhere in this box",

  // Upload modal
  um_title: "Upload video",
  um_file: "File",
  um_video_title: "Title",
  um_video_title_ph: "Give your video a title",
  um_description: "Description",
  um_description_ph: "Tell viewers about your video (optional)",
  um_tags: "Tags",
  um_tags_ph: "funkin, mod, week 7 (comma separated)",
  um_thumb: "Thumbnail",
  um_thumb_hint: "Optional — we grab one from the video automatically.",
  um_add_thumb: "Add thumbnail",
  um_change_thumb: "Change",
  um_publish: "Publish",
  um_publishing: "Publishing…",
  um_optional: "optional",
  um_title_required: "Please enter a title.",

  // Channel page
  customize_channel: "Customize channel",
  upload_video: "Upload video",
  videos_tab: "Videos",
  loading_channel: "Loading channel…",
  empty_owner: "You haven't uploaded any videos yet.",
  empty_other: "This channel hasn't uploaded any videos yet.",
  subscriber: "subscriber",
  subscribers: "subscribers",
  video_one: "video",
  video_many: "videos",

  // No channel
  no_channel_title: "You don't have a channel yet",
  no_channel_body: "Create a channel to upload videos, gain subscribers and customize your page.",
  create_channel: "Create channel",

  // Create channel modal
  cc_title: "Create your channel",
  cc_name: "Channel name",
  cc_name_ph: "e.g. Boyfriend Beats",
  cc_username: "Username",
  cc_username_ph: "yourname",
  cc_available: "Available",
  cc_taken: "Taken",
  cc_checking: "Checking…",
  cc_rule: "3–20 characters: letters, numbers and underscores. You can change it again after 5 days.",
  cc_create: "Create channel",
  cc_creating: "Creating…",
  cc_name_required: "Enter a channel name.",
  cc_username_required: "Enter a username.",
  cc_username_invalid: "3–20 letters, numbers or underscores only.",
  cc_username_locked: "You can change your username again in {n} day(s).",

  // Player
  views: "views",
  subscribe: "Subscribe",
  subscribed: "Subscribed",
  share: "Share",
  copied: "Copied!",
  comment_one: "Comment",
  comment_many: "Comments",
  add_comment: "Add a comment...",
  comment_btn: "Comment",
  no_comments: "No comments yet — be the first!",
  up_next: "Up next",
  no_up_next: "No other videos yet. Upload more clips to fill your vault.",
  remove_gif: "Remove GIF",
  no_source: "This clip has no playable source.",
  vc_delete_confirm: "Delete “{title}”? This cannot be undone.",
  vc_delete_aria: "Delete video",
  need_channel_upload: "Create a channel first to upload videos.",
  err_banned: "This account has been banned.",

  // Verified creator
  verified: "Verified",
  creator_title: "Creator of FunkVault",
  creator_sub: "Official verified account — the founder of FunkVault.",

  // Mobile nav
  nav_home: "Home",
  nav_trending: "Trending",
  nav_subs: "Subs",
  nav_you: "You",

  // Admin panel
  admin_title: "Admin panel",
  admin_users: "Users",
  admin_banned: "Banned",
  admin_videos: "Videos",
  admin_channels: "Channels",
  admin_search: "Search by name or email…",
  admin_loading: "Loading users…",
  admin_error: "Couldn't load users.",
  admin_none: "No users found.",
  admin_tag: "Admin",
  admin_banned_tag: "Banned",
  admin_protected: "Protected",
  admin_ban: "Ban",
  admin_unban: "Unban",
}

const RU: Dict = {
  tagline: "Твоё хранилище видео Friday Night Funkin'",
  search_placeholder: "Поиск видео, модов, чартов...",
  search: "Найти",
  upload: "Загрузить",
  your_channel: "Ваш канал",
  settings: "Настройки",
  language: "Язык",
  russian: "Русский",
  english: "English",
  done: "Готово",
  cancel: "Отмена",
  save: "Сохранить",
  saving: "Сохранение…",
  back: "Назад",
  logout: "Выйти",

  welcome_to: "Добро пожаловать в",
  welcome_sub: "Войдите или создайте аккаунт, чтобы загружать видео, комментировать и вести свой канал.",
  sign_in: "Вход",
  sign_up: "Создать аккаунт",
  name: "Имя",
  email: "Почта",
  password: "Пароль",
  log_in_btn: "Войти",
  create_btn: "Создать аккаунт",
  no_account: "Нет аккаунта?",
  have_account: "Уже есть аккаунт?",
  go_signup: "Зарегистрироваться",
  go_signin: "Войти",
  err_fill_all: "Заполните все поля.",
  err_invalid_login: "Неверная почта или пароль.",
  err_email_taken: "Эта почта уже зарегистрирована.",
  err_generic: "Что-то пошло не так. Попробуйте ещё раз.",
  name_ph: "Ваше имя",
  email_ph: "you@example.com",
  password_ph: "Придумайте пароль",

  home: "Главная",
  trending: "В тренде",
  subscriptions: "Подписки",
  you: "Вы",
  my_uploads: "Мои загрузки",
  library: "Библиотека",
  liked_videos: "Понравившиеся",
  tip: "Загрузите видео, добавьте название, теги и обложку — оно сразу появится на канале.",

  sec_your: "Ваш ",
  sec_top: "Лучшие ",
  sec_liked: "Понравившиеся ",
  vault: "Волт",
  uploads: "Загрузки",
  funkin: "Funkin'",
  subs_word: "Подписки",
  liked_word: "видео",
  library_word: "Библиотека",
  sub_vault: "Видео, которые вы загрузили",
  sub_uploads: "{n} в вашем волте",
  sub_trending: "По количеству лайков",
  sub_subs: "Свежие загрузки",
  sub_liked: "Ваши любимые",
  sub_library: "Всё в одном месте",

  empty_conn_title: "Проблема с подключением",
  empty_loading_title: "Загрузка вашего волта…",
  empty_loading_body: "Получаем видео из Supabase.",
  empty_liked_title: "Пока нет понравившихся видео",
  empty_liked_body: "Откройте видео и нажмите «Нравится».",
  empty_search_title: "Ничего не найдено",
  empty_search_body: "Попробуйте другое слово.",
  empty_vault_title: "Ваш волт пуст",
  empty_vault_body: "Перетащите видео в зону выше, чтобы добавить первый клип.",

  dz_loading: "Загрузка видео...",
  dz_title: "Перетащите видео для загрузки",
  dz_body: "Перетащите MP4, WebM или MOV сюда или выберите файл.",
  dz_pick: "Выбрать видео",
  dz_hint: "или бросьте его в эту область",

  um_title: "Загрузка видео",
  um_file: "Файл",
  um_video_title: "Название",
  um_video_title_ph: "Придумайте название",
  um_description: "Описание",
  um_description_ph: "Расскажите о видео (необязательно)",
  um_tags: "Теги",
  um_tags_ph: "funkin, mod, week 7 (через запятую)",
  um_thumb: "Обложка",
  um_thumb_hint: "Необязательно — мы возьмём кадр из видео автоматически.",
  um_add_thumb: "Добавить обложку",
  um_change_thumb: "Изменить",
  um_publish: "Опубликовать",
  um_publishing: "Публикация…",
  um_optional: "необязательно",
  um_title_required: "Введите название.",

  customize_channel: "Настроить канал",
  upload_video: "Загрузить видео",
  videos_tab: "Видео",
  loading_channel: "Загрузка канала…",
  empty_owner: "Вы ещё не загрузили ни одного видео.",
  empty_other: "На этом канале пока нет видео.",
  subscriber: "подписчик",
  subscribers: "подписчиков",
  video_one: "видео",
  video_many: "видео",

  no_channel_title: "У вас пока нет канала",
  no_channel_body: "Создайте канал, чтобы загружать видео, набирать подписчиков и оформить свою страницу.",
  create_channel: "Создать канал",

  cc_title: "Создание канала",
  cc_name: "Название канала",
  cc_name_ph: "нап��имер, Boyfriend Beats",
  cc_username: "Юзернейм",
  cc_username_ph: "yourname",
  cc_available: "Свободно",
  cc_taken: "Занято",
  cc_checking: "Проверка…",
  cc_rule: "3–20 символов: буквы, цифры и подчёркивание. Поменять можно через 5 дней.",
  cc_create: "Создать канал",
  cc_creating: "Создание…",
  cc_name_required: "Введите название канала.",
  cc_username_required: "Введите юзернейм.",
  cc_username_invalid: "3–20 букв, цифр или подчёркиваний.",
  cc_username_locked: "Поменять юзернейм можно через {n} дн.",

  views: "просмотров",
  subscribe: "Подписаться",
  subscribed: "Вы подписаны",
  share: "Поделиться",
  copied: "Скопировано!",
  comment_one: "комментарий",
  comment_many: "комментариев",
  add_comment: "Добавить комментарий...",
  comment_btn: "Отправить",
  no_comments: "Комментариев пока нет — будьте первым!",
  up_next: "Далее",
  no_up_next: "Других видео пока нет. Загрузите ещё клипы.",
  remove_gif: "Убрать GIF",
  no_source: "У этого клипа нет воспроизводимого источника.",
  vc_delete_confirm: "Удалить «{title}»? Это действие необратимо.",
  vc_delete_aria: "Удалить видео",
  need_channel_upload: "Сначала создайте канал, чтобы загружать видео.",
  err_banned: "Этот аккаунт заблокирован.",

  // Verified creator
  verified: "Подтверждён",
  creator_title: "Создатель проекта FunkVault",
  creator_sub: "Официальный подтверждённый аккаунт — основатель FunkVault.",

  // Mobile nav
  nav_home: "Главная",
  nav_trending: "Тренды",
  nav_subs: "Подписки",
  nav_you: "Вы",

  // Admin panel
  admin_title: "Админ-панель",
  admin_users: "Юзеры",
  admin_banned: "Забанено",
  admin_videos: "Видео",
  admin_channels: "Каналы",
  admin_search: "Поиск по имени или почте…",
  admin_loading: "Загрузка пользователей…",
  admin_error: "Не удалось загрузить пользователей.",
  admin_none: "Пользователи не найдены.",
  admin_tag: "Админ",
  admin_banned_tag: "Бан",
  admin_protected: "Защищён",
  admin_ban: "Забанить",
  admin_unban: "Разбанить",
}

const DICTS: Record<Lang, Dict> = { en: EN, ru: RU }

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("fv_lang")
    return saved === "en" || saved === "ru" ? saved : "ru"
  })

  const value = useMemo<Ctx>(() => {
    const setLang = (l: Lang) => {
      setLangState(l)
      localStorage.setItem("fv_lang", l)
    }
    const t = (key: string, vars?: Record<string, string | number>) => {
      let s = DICTS[lang][key] ?? EN[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(`{${k}}`, String(v))
        }
      }
      return s
    }
    return { lang, setLang, t }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): Ctx {
  const c = useContext(I18nContext)
  if (!c) throw new Error("useI18n must be used within I18nProvider")
  return c
}
