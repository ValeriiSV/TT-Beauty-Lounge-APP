import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://azfacbrdujwadnsoasnz.supabase.co";
const legacyServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const secretKeys = (() => {
  try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); } catch { return {}; }
})();
const SERVICE_KEY = String(secretKeys.default || legacyServiceKey);
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const ADMIN_SETUP_CODE = Deno.env.get("TELEGRAM_ADMIN_SETUP_CODE") || "";
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || "";

type Lang = "ro" | "ru";
type Draft = { step: string; data: Record<string, string> };
type TelegramUser = { id?: number; username?: string; first_name?: string; last_name?: string };

const CONTACT_PHONE = "+373 60 315 799";
const MAP_URL = "https://maps.app.goo.gl/zRLtjFdoJ3BUi8KTA";

const services = {
  women_cut: { category: "hair", ro: "Tunsori dame", ru: "Женская стрижка", price: "200–500 MDL", duration: 60, hair: true, icon: "✂️" },
  bangs: { category: "hair", ro: "Breton", ru: "Чёлка", price: "50 MDL", duration: 10, hair: false, icon: "✂️" },
  men_cut: { category: "hair", ro: "Tunsori bărbați (barbă)", ru: "Мужская стрижка (борода)", price: "150–250 MDL", duration: 30, hair: false, icon: "🧔" },
  tech_color: { category: "hair", ro: "Vopsiri în tehnică", ru: "Сложное окрашивание", price: "2500–5000 MDL", duration: 300, hair: true, icon: "🎨" },
  one_tone: { category: "hair", ro: "Vopsire într-o nuanță / tonarea părului", ru: "Окрашивание в один тон / тонирование", price: "450–1500 MDL", duration: 90, hair: true, icon: "🎨" },
  evening_hair: { category: "hair", ro: "Coafuri de seară", ru: "Вечерняя причёска", price: "1000–2000 MDL", duration: 90, hair: true, icon: "✨" },
  curls: { category: "hair", ro: "Bucle pe ondulator", ru: "Локоны", price: "450–800 MDL", duration: 60, hair: true, icon: "〰️" },
  bridal_hair: { category: "hair", ro: "Coafuri de mireasă", ru: "Свадебная причёска", price: "2000–2500 MDL", duration: 120, hair: true, icon: "👰" },
  evening_makeup: { category: "makeup", ro: "Make-Up de seară", ru: "Вечерний макияж", price: "600–900 MDL", duration: 60, hair: false, icon: "💄" },
  bridal_makeup: { category: "makeup", ro: "Make-Up mireasă", ru: "Свадебный макияж", price: "1500 MDL", duration: 60, hair: false, icon: "💄" }
} as const;

type ServiceCode = keyof typeof services;

const copy = {
  ro: {
    welcome: "Bine ai venit la TT Beauty Lounge! Alege limba:",
    menuTitle: "TT Beauty Lounge · Meniu client",
    newBooking: "➕ Programare nouă", myBookings: "📋 Programările mele",
    cancelRequest: "❌ Anulează cererea", contact: "☎️ Contact", location: "📍 Locație",
    chooseService: "Alege serviciul dorit:", chooseHair: "Alege lungimea părului:",
    chooseDate: "Alege data:", chooseTime: "Alege una dintre orele disponibile:",
    noSlots: "Nu există ore libere în această zi. Alege altă dată.",
    name: "Scrie numele și prenumele:",
    phone: "Trimite numărul de telefon folosind butonul de mai jos sau scrie-l în mesaj:",
    sendPhone: "📱 Trimite numărul", note: "Adaugă observații pentru salon sau alege «Fără observații»:",
    noNote: "Fără observații", confirm: "✅ Confirmă cererea", backMenu: "⬅️ Meniu",
    requestSent: "✅ Cererea a fost trimisă salonului și este în așteptarea confirmării administratorului. Vei primi răspunsul aici, în Telegram.",
    slotGone: "Ora aleasă nu mai este disponibilă. Te rog alege alt interval.",
    invalidName: "Te rog introdu un nume de cel puțin 2 caractere.",
    invalidPhone: "Numărul pare incomplet. Introdu cel puțin 5 cifre.",
    noBookings: "Nu ai programări înregistrate în Telegram.",
    noPending: "Nu ai cereri în așteptare care pot fi anulate.",
    cancelled: "Cererea a fost anulată.",
    contactText: `☎️ TT Beauty Lounge\nTelefon: ${CONTACT_PHONE}\nInstagram: @tatiana_tataru_`,
    locationText: `📍 TT Beauty Lounge\nOr. Chișinău, Str. Columna 59\n${MAP_URL}`,
    approved: "✅ Programarea ta a fost confirmată de salon!",
    rejected: "❌ Cererea ta de programare a fost refuzată. Te invităm să alegi o altă dată sau oră.",
    status: { pending: "În așteptare", approved: "Confirmată", rejected: "Refuzată" }
  },
  ru: {
    welcome: "Добро пожаловать в TT Beauty Lounge! Выберите язык:",
    menuTitle: "TT Beauty Lounge · Меню клиента",
    newBooking: "➕ Новая запись", myBookings: "📋 Мои записи",
    cancelRequest: "❌ Отменить заявку", contact: "☎️ Контакты", location: "📍 Адрес",
    chooseService: "Выберите услугу:", chooseHair: "Выберите длину волос:",
    chooseDate: "Выберите дату:", chooseTime: "Выберите доступное время:",
    noSlots: "На этот день свободного времени нет. Выберите другую дату.",
    name: "Напишите имя и фамилию:",
    phone: "Отправьте номер кнопкой ниже или напишите его сообщением:",
    sendPhone: "📱 Отправить номер", note: "Добавьте комментарий для салона или выберите «Без комментария»:",
    noNote: "Без комментария", confirm: "✅ Отправить заявку", backMenu: "⬅️ Меню",
    requestSent: "✅ Заявка отправлена в салон и ожидает подтверждения администратора. Ответ придёт сюда, в Telegram.",
    slotGone: "Выбранное время уже занято. Пожалуйста, выберите другой интервал.",
    invalidName: "Введите имя длиной не менее 2 символов.",
    invalidPhone: "Номер выглядит неполным. Введите не менее 5 цифр.",
    noBookings: "У вас пока нет записей, созданных в Telegram.",
    noPending: "У вас нет заявок в ожидании, которые можно отменить.",
    cancelled: "Заявка отменена.",
    contactText: `☎️ TT Beauty Lounge\nТелефон: ${CONTACT_PHONE}\nInstagram: @tatiana_tataru_`,
    locationText: `📍 TT Beauty Lounge\nг. Кишинёв, ул. Колумна 59\n${MAP_URL}`,
    approved: "✅ Салон подтвердил вашу запись!",
    rejected: "❌ Салон отклонил заявку. Пожалуйста, выберите другую дату или время.",
    status: { pending: "Ожидает", approved: "Подтверждена", rejected: "Отклонена" }
  }
} as const;

function serviceName(code: ServiceCode, lang: Lang) { return services[code][lang]; }
function formatDuration(n: number, lang: Lang = "ro") {
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60), m = n % 60;
  return lang === "ru" ? `${h} ч${m ? ` ${m} мин` : ""}` : `${h} h${m ? ` ${m} min` : ""}`;
}
function dateLabel(value: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "ro-RO", { timeZone: "Europe/Chisinau", weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00+03:00`));
}
function dateRo(value: string) { const [y, m, d] = value.split("-"); return `${d}.${m}.${y}`; }
function todayMd() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Chisinau", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function html(value: unknown) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function validPhone(value: string) { return value.replace(/\D/g, "").length >= 5 && value.length <= 30; }

const dbHeaders: Record<string, string> = { apikey: SERVICE_KEY, "Content-Type": "application/json" };
if (SERVICE_KEY.split(".").length === 3) dbHeaders.Authorization = `Bearer ${SERVICE_KEY}`;

async function telegram(method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false) throw new Error(`telegram_${method}_failed`);
  return result;
}
function sendMessage(chatId: number, text: string, replyMarkup?: Record<string, unknown>, parseMode?: string) {
  return telegram("sendMessage", { chat_id: chatId, text, ...(replyMarkup ? { reply_markup: replyMarkup } : {}), ...(parseMode ? { parse_mode: parseMode } : {}) });
}
function answerCallback(id: string, text = "", showAlert = false) {
  return telegram("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}), show_alert: showAlert }).catch(() => null);
}
async function rpc(name: string, payload: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: dbHeaders, body: JSON.stringify(payload) });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(String(result?.message || result?.error || `${name}_failed`));
  return result;
}
async function isAdmin(chatId: number) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/telegram_admins?chat_id=eq.${chatId}&select=chat_id&limit=1`, { headers: dbHeaders });
  if (!response.ok) throw new Error("admin_check_failed");
  return (await response.json()).length > 0;
}
async function registerAdmin(chatId: number, user: TelegramUser, setupCode: string) {
  if (!ADMIN_SETUP_CODE || setupCode !== ADMIN_SETUP_CODE) return false;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/telegram_admins`, {
    method: "POST", headers: { ...dbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ chat_id: chatId, username: user.username || null, display_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || "Administrator" })
  });
  return response.ok;
}
async function getDraft(chatId: number): Promise<Draft | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/telegram_booking_drafts?chat_id=eq.${chatId}&select=step,data&limit=1`, { headers: dbHeaders });
  if (!response.ok) throw new Error("draft_load_failed");
  return (await response.json())[0] || null;
}
async function saveDraft(chatId: number, step: string, data: Record<string, string>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/telegram_booking_drafts`, {
    method: "POST", headers: { ...dbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ chat_id: chatId, step, data, updated_at: new Date().toISOString() })
  });
  if (!response.ok) throw new Error("draft_save_failed");
}
async function deleteDraft(chatId: number) {
  await fetch(`${SUPABASE_URL}/rest/v1/telegram_booking_drafts?chat_id=eq.${chatId}`, { method: "DELETE", headers: dbHeaders });
}
async function upsertClient(chatId: number, user: TelegramUser, lang: Lang) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/telegram_clients`, {
    method: "POST", headers: { ...dbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ chat_id: chatId, username: user.username || null, language: lang, first_name: user.first_name || null, last_name: user.last_name || null, updated_at: new Date().toISOString() })
  });
  if (!response.ok) throw new Error("client_save_failed");
}
async function getClientLang(chatId: number): Promise<Lang> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/telegram_clients?chat_id=eq.${chatId}&select=language&limit=1`, { headers: dbHeaders });
  if (!response.ok) return "ro";
  return ((await response.json())[0]?.language === "ru" ? "ru" : "ro");
}
async function admins() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/telegram_admins?select=chat_id`, { headers: dbHeaders });
  if (!response.ok) return [] as Array<{ chat_id: number }>;
  return await response.json();
}
async function availableSlots(date: string, service: string) {
  return await rpc("available_appointment_slots", { p_date: date, p_service: service }) as Array<{ slot_time: string; label: string }>;
}

function clientMenu(lang: Lang) {
  const t = copy[lang];
  return { keyboard: [[{ text: t.newBooking }, { text: t.myBookings }], [{ text: t.cancelRequest }], [{ text: t.contact }, { text: t.location }]], resize_keyboard: true };
}
function cancelKeyboard(lang: Lang) { return { keyboard: [[{ text: copy[lang].backMenu }]], resize_keyboard: true }; }
function serviceKeyboard(lang: Lang) {
  return { inline_keyboard: [...Object.entries(services).map(([code, s]) => [{ text: `${s.icon} ${serviceName(code as ServiceCode, lang)} · ${s.price}`, callback_data: `c:svc:${code}` }]), [{ text: copy[lang].backMenu, callback_data: "c:menu" }]] };
}
function hairKeyboard(lang: Lang) {
  const labels = lang === "ru" ? [["Короткие", "Scurt"], ["Средние", "Mediu"], ["Длинные", "Lung"], ["Очень длинные", "Foarte lung"]] : [["Scurt", "Scurt"], ["Mediu", "Mediu"], ["Lung", "Lung"], ["Foarte lung", "Foarte lung"]];
  return { inline_keyboard: [[0, 1].map(i => ({ text: labels[i][0], callback_data: `c:hair:${labels[i][1]}` })), [2, 3].map(i => ({ text: labels[i][0], callback_data: `c:hair:${labels[i][1]}` })), [{ text: copy[lang].backMenu, callback_data: "c:menu" }]] };
}
function dateKeyboard(lang: Lang) {
  const start = new Date(`${todayMd()}T12:00:00+03:00`), dates: string[] = [];
  for (let i = 0; dates.length < 14 && i < 24; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    if (d.getDay() === 0) continue;
    dates.push(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Chisinau", year: "numeric", month: "2-digit", day: "2-digit" }).format(d));
  }
  const rows = [] as Array<Array<Record<string, string>>>;
  for (let i = 0; i < dates.length; i += 2) rows.push(dates.slice(i, i + 2).map(date => ({ text: dateLabel(date, lang), callback_data: `c:date:${date}` })));
  rows.push([{ text: copy[lang].backMenu, callback_data: "c:menu" }]);
  return { inline_keyboard: rows };
}
function slotsKeyboard(rows: Array<{ slot_time: string; label: string }>, lang: Lang) {
  const kb = [] as Array<Array<Record<string, string>>>;
  for (let i = 0; i < rows.length; i += 3) kb.push(rows.slice(i, i + 3).map(s => ({ text: String(s.slot_time).slice(0, 5), callback_data: `c:time:${String(s.slot_time).slice(0, 5)}` })));
  kb.push([{ text: lang === "ru" ? "⬅️ Другая дата" : "⬅️ Altă dată", callback_data: "c:dates" }]);
  return { inline_keyboard: kb };
}
function languageKeyboard() { return { inline_keyboard: [[{ text: "🇷🇴 Română", callback_data: "c:lang:ro" }, { text: "🇷🇺 Русский", callback_data: "c:lang:ru" }]] }; }
async function showClientMenu(chatId: number, lang: Lang, text?: string) { await sendMessage(chatId, text || copy[lang].menuTitle, clientMenu(lang)); }

async function startClientBooking(chatId: number, lang: Lang) {
  await deleteDraft(chatId);
  await saveDraft(chatId, "client_service", { lang });
  await sendMessage(chatId, copy[lang].chooseService, serviceKeyboard(lang));
}
async function showMyBookings(chatId: number, lang: Lang) {
  const rows = await rpc("telegram_client_list_appointments", { p_chat_id: chatId }) as Array<Record<string, unknown>>;
  if (!rows?.length) { await showClientMenu(chatId, lang, copy[lang].noBookings); return; }
  const status = copy[lang].status;
  const text = rows.slice(0, 15).map(a => {
    const key = String(a.status) as keyof typeof status;
    return `${key === "approved" ? "✅" : key === "rejected" ? "❌" : "⏳"} ${dateRo(String(a.preferred_date))} · ${String(a.preferred_time).slice(0, 5)}\n${a.service}\n${status[key] || key}`;
  }).join("\n\n");
  await showClientMenu(chatId, lang, `${copy[lang].myBookings}\n\n${text}`);
}
async function showCancelable(chatId: number, lang: Lang) {
  const rows = (await rpc("telegram_client_list_appointments", { p_chat_id: chatId }) as Array<Record<string, unknown>>).filter(a => a.status === "pending");
  if (!rows.length) { await showClientMenu(chatId, lang, copy[lang].noPending); return; }
  const kb = rows.slice(0, 20).map(a => [{ text: `❌ ${dateRo(String(a.preferred_date))} · ${String(a.preferred_time).slice(0, 5)} · ${a.service}`, callback_data: `c:cancel:${a.id}` }]);
  kb.push([{ text: copy[lang].backMenu, callback_data: "c:menu" }]);
  await sendMessage(chatId, copy[lang].cancelRequest, { inline_keyboard: kb });
}
function clientSummary(data: Record<string, string>, lang: Lang) {
  const svc = services[data.service_code as ServiceCode];
  const lines = [lang === "ru" ? "Проверьте заявку:" : "Verifică cererea:", "", `👤 ${data.name}`, `📞 ${data.phone}`, `${svc.icon} ${serviceName(data.service_code as ServiceCode, lang)}`];
  if (data.hair_length) lines.push(`📏 ${data.hair_length}`);
  lines.push(`📅 ${dateRo(data.date)} · ${data.time}`);
  if (data.note) lines.push(`📝 ${data.note}`);
  return lines.join("\n");
}
async function notifyAdminsNewRequest(appointmentId: string, data: Record<string, string>, user: TelegramUser) {
  const svc = services[data.service_code as ServiceCode];
  const text = [`🔔 Cerere nouă din Telegram`, "", `👤 ${data.name}`, `📞 ${data.phone}`, `💇 ${svc.ro}`, ...(data.hair_length ? [`📏 ${data.hair_length}`] : []), `📅 ${dateRo(data.date)} · ${data.time}`, `🕒 ${formatDuration(svc.duration)}`, `📝 ${data.note || "Fără observații"}`, `Telegram: ${user.username ? `@${user.username}` : `chat ${user.id}`}`, "", "Status: în așteptare"].join("\n");
  const markup = { inline_keyboard: [[{ text: "✅ Confirmă", callback_data: `decision:approved:${appointmentId}` }, { text: "❌ Refuză", callback_data: `decision:rejected:${appointmentId}` }]] };
  await Promise.allSettled((await admins()).map(a => sendMessage(Number(a.chat_id), text, markup)));
}
async function notifyAdminsCancellation(data: Record<string, unknown>, chatId: number) {
  const text = `⚠️ Clientul a anulat cererea pending\n\n${data.service}\n📅 ${dateRo(String(data.preferred_date))} · ${String(data.preferred_time).slice(0, 5)}\nTelegram chat: ${chatId}`;
  await Promise.allSettled((await admins()).map(a => sendMessage(Number(a.chat_id), text)));
}

async function clientTextFlow(chatId: number, text: string, message: Record<string, unknown>, user: TelegramUser, lang: Lang) {
  const t = copy[lang];
  if (text === t.newBooking) { await startClientBooking(chatId, lang); return; }
  if (text === t.myBookings) { await showMyBookings(chatId, lang); return; }
  if (text === t.cancelRequest) { await showCancelable(chatId, lang); return; }
  if (text === t.contact) { await showClientMenu(chatId, lang, t.contactText); return; }
  if (text === t.location) { await showClientMenu(chatId, lang, t.locationText); return; }
  if (text === t.backMenu || text === "/menu") { await deleteDraft(chatId); await showClientMenu(chatId, lang); return; }

  const draft = await getDraft(chatId);
  if (!draft) { await showClientMenu(chatId, lang); return; }
  const data = draft.data || {};
  if (draft.step === "client_name") {
    if (text.trim().length < 2 || text.length > 100) { await sendMessage(chatId, t.invalidName); return; }
    await saveDraft(chatId, "client_phone", { ...data, name: text.trim() });
    await sendMessage(chatId, t.phone, { keyboard: [[{ text: t.sendPhone, request_contact: true }], [{ text: t.backMenu }]], resize_keyboard: true, one_time_keyboard: true });
    return;
  }
  if (draft.step === "client_phone") {
    const contact = message.contact as Record<string, unknown> | undefined;
    const phone = String(contact?.phone_number || text).trim();
    if (!validPhone(phone)) { await sendMessage(chatId, t.invalidPhone); return; }
    await saveDraft(chatId, "client_note", { ...data, phone });
    await sendMessage(chatId, t.note, { keyboard: [[{ text: t.noNote }], [{ text: t.backMenu }]], resize_keyboard: true, one_time_keyboard: true });
    return;
  }
  if (draft.step === "client_note") {
    const note = text === t.noNote ? "" : text.trim().slice(0, 1000);
    const next = { ...data, note };
    await saveDraft(chatId, "client_confirm", next);
    await sendMessage(chatId, clientSummary(next, lang), { inline_keyboard: [[{ text: t.confirm, callback_data: "c:submit" }], [{ text: t.backMenu, callback_data: "c:menu" }]] });
    return;
  }
  await showClientMenu(chatId, lang);
}

async function clientCallbackFlow(chatId: number, callbackId: string, callback: string, user: TelegramUser, lang: Lang) {
  await answerCallback(callbackId);
  const t = copy[lang];
  if (callback.startsWith("c:lang:")) {
    const selected = callback.endsWith(":ru") ? "ru" : "ro";
    await upsertClient(chatId, user, selected);
    await deleteDraft(chatId);
    await showClientMenu(chatId, selected);
    return;
  }
  if (callback === "c:menu") { await deleteDraft(chatId); await showClientMenu(chatId, lang); return; }
  if (callback === "c:dates") {
    const draft = await getDraft(chatId); if (!draft) return showClientMenu(chatId, lang);
    await saveDraft(chatId, "client_date", draft.data);
    await sendMessage(chatId, t.chooseDate, dateKeyboard(lang)); return;
  }
  if (callback.startsWith("c:svc:")) {
    const code = callback.slice(6) as ServiceCode, svc = services[code];
    if (!svc) return;
    const data = { lang, service_code: code, service: svc.ro };
    if (svc.hair) { await saveDraft(chatId, "client_hair_length", data); await sendMessage(chatId, t.chooseHair, hairKeyboard(lang)); }
    else { await saveDraft(chatId, "client_date", data); await sendMessage(chatId, t.chooseDate, dateKeyboard(lang)); }
    return;
  }
  if (callback.startsWith("c:hair:")) {
    const draft = await getDraft(chatId); if (!draft) return showClientMenu(chatId, lang);
    await saveDraft(chatId, "client_date", { ...draft.data, hair_length: callback.slice(7) });
    await sendMessage(chatId, t.chooseDate, dateKeyboard(lang)); return;
  }
  if (callback.startsWith("c:date:")) {
    const date = callback.slice(7), draft = await getDraft(chatId); if (!draft) return showClientMenu(chatId, lang);
    const rows = await availableSlots(date, draft.data.service);
    if (!rows.length) { await answerCallback(callbackId, t.noSlots, true); await sendMessage(chatId, t.noSlots, dateKeyboard(lang)); return; }
    await saveDraft(chatId, "client_time", { ...draft.data, date });
    await sendMessage(chatId, t.chooseTime, slotsKeyboard(rows, lang)); return;
  }
  if (callback.startsWith("c:time:")) {
    const draft = await getDraft(chatId); if (!draft) return showClientMenu(chatId, lang);
    const time = callback.slice(7);
    const rows = await availableSlots(draft.data.date, draft.data.service);
    if (!rows.some(s => String(s.slot_time).slice(0, 5) === time)) { await sendMessage(chatId, t.slotGone, slotsKeyboard(rows, lang)); return; }
    await saveDraft(chatId, "client_name", { ...draft.data, time });
    await sendMessage(chatId, t.name, cancelKeyboard(lang)); return;
  }
  if (callback === "c:submit") {
    const draft = await getDraft(chatId); if (!draft || draft.step !== "client_confirm") return showClientMenu(chatId, lang);
    const data = draft.data;
    try {
      const result = await rpc("telegram_create_client_appointment", {
        p_chat_id: chatId, p_username: user.username || null, p_language: lang,
        p_name: data.name, p_phone: data.phone, p_service: data.service,
        p_hair_length: data.hair_length || null, p_date: data.date, p_time: data.time, p_note: data.note || null
      });
      await deleteDraft(chatId);
      await showClientMenu(chatId, lang, t.requestSent);
      await notifyAdminsNewRequest(String(result.id), data, user);
    } catch (error) {
      if (String((error as Error).message).includes("slot_unavailable")) {
        const rows = await availableSlots(data.date, data.service);
        await saveDraft(chatId, "client_time", { ...data, time: "" });
        await sendMessage(chatId, t.slotGone, rows.length ? slotsKeyboard(rows, lang) : dateKeyboard(lang));
      } else throw error;
    }
    return;
  }
  if (callback.startsWith("c:cancel:")) {
    try {
      const result = await rpc("telegram_client_cancel_pending", { p_id: callback.slice(9), p_chat_id: chatId });
      await showClientMenu(chatId, lang, t.cancelled);
      await notifyAdminsCancellation(result, chatId);
    } catch { await showClientMenu(chatId, lang, t.noPending); }
  }
}

// Existing administrator functions.
const adminMenu = { inline_keyboard: [[{ text: "➕ Programare nouă", callback_data: "menu:new" }], [{ text: "📋 Programările de azi", callback_data: "menu:today" }, { text: "📅 Calendar", callback_data: "menu:calendar" }], [{ text: "✏️ Modifică programare", callback_data: "menu:edit" }, { text: "🗑 Anulează programare", callback_data: "menu:cancel" }]] };
const adminCategories = { inline_keyboard: [[{ text: "💇 Păr", callback_data: "cat:hair" }, { text: "💄 Make-Up", callback_data: "cat:makeup" }], [{ text: "⬅️ Meniu", callback_data: "menu:home" }]] };
function adminServiceKeyboard(category: string) { return { inline_keyboard: [...Object.entries(services).filter(([, s]) => s.category === category).map(([code, s]) => [{ text: `${s.icon} ${s.ro} · ${s.price} · ${formatDuration(s.duration)}`, callback_data: `svc:${code}` }]), [{ text: "⬅️ Categorii", callback_data: "back:cats" }]] }; }
const adminHairKeyboard = { inline_keyboard: [[{ text: "Scurt", callback_data: "hair:Scurt" }, { text: "Mediu", callback_data: "hair:Mediu" }], [{ text: "Lung", callback_data: "hair:Lung" }, { text: "Foarte lung", callback_data: "hair:Foarte lung" }], [{ text: "❌ Renunță", callback_data: "flow:cancel" }]] };
const adminConfirmKeyboard = { inline_keyboard: [[{ text: "✅ Confirmă", callback_data: "book:confirm" }], [{ text: "❌ Renunță", callback_data: "flow:cancel" }]] };
async function showAdminMenu(chatId: number, text = "TT Beauty Lounge · Administrare") { await sendMessage(chatId, text, adminMenu); }
async function listAdminAppointments(date: string | null = null, future = false) { return await rpc("telegram_admin_list_appointments", { p_date: date, p_future: future }); }
async function showAdminDay(chatId: number, title: string, rows: Array<Record<string, unknown>>) {
  if (!rows?.length) return showAdminMenu(chatId, `${title}\n\nNu există programări.`);
  const body = rows.map(a => `🕒 ${String(a.preferred_time).slice(0, 5)} · ${a.name}\n${a.service} · ${formatDuration(Number(a.duration_minutes || 60))} · ${a.quoted_price ? `${a.quoted_price} MDL` : "preț nesetat"}\n📞 ${a.phone}\nStatus: ${a.status}`).join("\n\n");
  await showAdminMenu(chatId, `${title}\n\n${body}`);
}
async function adminFuturePicker(chatId: number, mode: "edit" | "cancel") {
  const rows = await listAdminAppointments(null, true);
  if (!rows?.length) return showAdminMenu(chatId, "Nu există programări viitoare.");
  const kb = rows.slice(0, 40).map((a: Record<string, unknown>) => [{ text: `${dateRo(String(a.preferred_date))} · ${String(a.preferred_time).slice(0, 5)} · ${a.name}`, callback_data: `${mode}:${a.id}` }]);
  kb.push([{ text: "⬅️ Meniu", callback_data: "menu:home" }]);
  await sendMessage(chatId, mode === "edit" ? "Alege programarea de modificat:" : "Alege programarea de anulat:", { inline_keyboard: kb });
}
async function adminSlots(chatId: number, date: string, service: string, prefix: string) {
  const rows = await availableSlots(date, service);
  if (!rows.length) { await sendMessage(chatId, "Nu există ore libere. Trimite altă dată YYYY-MM-DD."); return; }
  const kb = [] as Array<Array<Record<string, string>>>;
  for (let i = 0; i < rows.length; i += 3) kb.push(rows.slice(i, i + 3).map(s => ({ text: s.label, callback_data: `${prefix}:${String(s.slot_time).slice(0, 5)}` })));
  kb.push([{ text: "❌ Renunță", callback_data: "flow:cancel" }]);
  await sendMessage(chatId, "Alege ora:", { inline_keyboard: kb });
}
async function adminNewBooking(chatId: number) { await deleteDraft(chatId); await saveDraft(chatId, "name", {}); await sendMessage(chatId, "➕ Programare nouă\n\nScrie numele și prenumele clientei:"); }
async function adminTextFlow(chatId: number, text: string) {
  const draft = await getDraft(chatId); if (!draft) return showAdminMenu(chatId);
  const data = draft.data || {};
  if (draft.step === "name") { await saveDraft(chatId, "phone", { ...data, name: text }); await sendMessage(chatId, "Introdu telefonul:"); return; }
  if (draft.step === "phone") { if (!validPhone(text)) { await sendMessage(chatId, "Introdu un telefon valid."); return; } await saveDraft(chatId, "category", { ...data, phone: text }); await sendMessage(chatId, "Alege categoria:", adminCategories); return; }
  if (draft.step === "price") { const p = Number(text.replace(",", ".").replace(/[^0-9.]/g, "")); if (!p) { await sendMessage(chatId, "Introdu un preț valid."); return; } await saveDraft(chatId, "date", { ...data, quoted_price: String(p) }); await sendMessage(chatId, "Trimite data YYYY-MM-DD:"); return; }
  if (draft.step === "date") { if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) { await sendMessage(chatId, "Format invalid. Folosește YYYY-MM-DD."); return; } await saveDraft(chatId, "time", { ...data, preferred_date: text }); await adminSlots(chatId, text, data.service, "time"); return; }
  if (draft.step === "calendar") { if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) { await sendMessage(chatId, "Format invalid. Folosește YYYY-MM-DD."); return; } await deleteDraft(chatId); await showAdminDay(chatId, `📅 Programări ${dateRo(text)}`, await listAdminAppointments(text, false)); return; }
  if (draft.step === "edit_date") { if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) { await sendMessage(chatId, "Format invalid. Folosește YYYY-MM-DD."); return; } const rows = await listAdminAppointments(null, true), a = rows.find((q: Record<string, unknown>) => q.id === data.appointment_id); if (!a) { await deleteDraft(chatId); await showAdminMenu(chatId, "Programarea nu mai există."); return; } await saveDraft(chatId, "edit_time", { ...data, new_date: text, service: String(a.service) }); await adminSlots(chatId, text, String(a.service), "etime"); }
}
async function adminDecision(chatId: number, callbackId: string, callback: string) {
  const [, action, appointmentId] = callback.split(":");
  try {
    const booking = await rpc("telegram_admin_decide_appointment", { p_id: appointmentId, p_action: action, p_quoted_price: null });
    const lang: Lang = booking.telegram_language === "ru" ? "ru" : "ro";
    if (booking.telegram_chat_id) {
      const headline = action === "approved" ? copy[lang].approved : copy[lang].rejected;
      const details = `${headline}\n\n${booking.service}\n📅 ${dateRo(String(booking.preferred_date))} · ${String(booking.preferred_time).slice(0, 5)}${booking.quoted_price ? `\n💰 ${booking.quoted_price} MDL` : ""}`;
      await sendMessage(Number(booking.telegram_chat_id), details, clientMenu(lang));
    }
    await answerCallback(callbackId, action === "approved" ? "Programare confirmată" : "Cerere refuzată", true);
    await sendMessage(chatId, action === "approved" ? "✅ Programarea a fost confirmată, iar clienta a fost notificată." : "❌ Cererea a fost refuzată, iar clienta a fost notificată.", adminMenu);
  } catch (error) {
    const message = String((error as Error).message);
    await answerCallback(callbackId, message.includes("slot_unavailable") ? "Slotul nu mai este disponibil." : "Cererea a fost deja procesată.", true);
  }
}
async function adminCallbackFlow(chatId: number, callbackId: string, callback: string) {
  if (callback.startsWith("decision:")) return adminDecision(chatId, callbackId, callback);
  await answerCallback(callbackId);
  if (callback === "menu:home" || callback === "flow:cancel") { await deleteDraft(chatId); await showAdminMenu(chatId); return; }
  if (callback === "menu:new") return adminNewBooking(chatId);
  if (callback === "menu:today") { await deleteDraft(chatId); await showAdminDay(chatId, "📋 Programările de azi", await listAdminAppointments(todayMd(), false)); return; }
  if (callback === "menu:calendar") { await deleteDraft(chatId); await saveDraft(chatId, "calendar", {}); await sendMessage(chatId, "📅 Trimite data YYYY-MM-DD:"); return; }
  if (callback === "menu:edit") { await deleteDraft(chatId); await adminFuturePicker(chatId, "edit"); return; }
  if (callback === "menu:cancel") { await deleteDraft(chatId); await adminFuturePicker(chatId, "cancel"); return; }
  if (callback === "back:cats") { const d = await getDraft(chatId); await saveDraft(chatId, "category", d?.data || {}); await sendMessage(chatId, "Alege categoria:", adminCategories); return; }
  if (callback.startsWith("cat:")) { const d = await getDraft(chatId), category = callback.split(":")[1]; await saveDraft(chatId, "service", { ...(d?.data || {}), category }); await sendMessage(chatId, "Alege serviciul:", adminServiceKeyboard(category)); return; }
  if (callback.startsWith("svc:")) { const d = await getDraft(chatId), code = callback.split(":")[1] as ServiceCode, s = services[code]; if (!s) return; const next = { ...(d?.data || {}), service: s.ro }; if (s.hair) { await saveDraft(chatId, "hair", next); await sendMessage(chatId, `${s.ro}\n${s.price} · ${formatDuration(s.duration)}\n\nAlege lungimea părului:`, adminHairKeyboard); } else { await saveDraft(chatId, "price", { ...next, hair_length: "Scurt" }); await sendMessage(chatId, "Introdu prețul stabilit, MDL:"); } return; }
  if (callback.startsWith("hair:")) { const d = await getDraft(chatId); await saveDraft(chatId, "price", { ...(d?.data || {}), hair_length: callback.slice(5) }); await sendMessage(chatId, "Introdu prețul stabilit, MDL:"); return; }
  if (callback.startsWith("time:")) { const d = await getDraft(chatId), time = callback.slice(5), data = d?.data || {}; await saveDraft(chatId, "confirm", { ...data, preferred_time: time }); await sendMessage(chatId, `Confirmă:\n\n👤 ${data.name}\n📞 ${data.phone}\n💇 ${data.service}\n📏 ${data.hair_length}\n💰 ${data.quoted_price} MDL\n📅 ${dateRo(data.preferred_date)} · ${time}`, adminConfirmKeyboard); return; }
  if (callback === "book:confirm") { const d = await getDraft(chatId), data = d?.data || {}; try { await rpc("admin_create_phone_appointment", { p_name: data.name, p_phone: data.phone, p_service: data.service, p_date: data.preferred_date, p_time: data.preferred_time, p_hair_length: data.hair_length, p_quoted_price: Number(data.quoted_price) }); await deleteDraft(chatId); await showAdminMenu(chatId, "✅ Programarea a fost adăugată."); } catch (e) { await showAdminMenu(chatId, `Nu am putut crea: ${String((e as Error).message)}`); } return; }
  if (callback.startsWith("edit:")) { await deleteDraft(chatId); await saveDraft(chatId, "edit_date", { appointment_id: callback.slice(5) }); await sendMessage(chatId, "Trimite noua dată YYYY-MM-DD:"); return; }
  if (callback.startsWith("etime:")) { const d = await getDraft(chatId), data = d?.data || {}, time = callback.slice(6); try { await rpc("telegram_admin_reschedule_appointment", { p_id: data.appointment_id, p_date: data.new_date, p_time: time }); await deleteDraft(chatId); await showAdminMenu(chatId, `✅ Mutată pe ${dateRo(data.new_date)} la ${time}.`); } catch (e) { await showAdminMenu(chatId, `Nu am putut modifica: ${String((e as Error).message)}`); } return; }
  if (callback.startsWith("cancel:")) { try { await rpc("telegram_admin_cancel_appointment", { p_id: callback.slice(7) }); await showAdminMenu(chatId, "🗑 Programarea a fost anulată."); } catch (e) { await showAdminMenu(chatId, `Nu am putut anula: ${String((e as Error).message)}`); } }
}

async function linkClientAppointment(chatId: number, code: string) {
  const booking = await rpc("link_appointment_telegram", { p_code: code, p_chat_id: chatId });
  const lang = await getClientLang(chatId);
  if (booking.found) await showClientMenu(chatId, lang, `Mulțumim, ${booking.name}! Vei primi aici confirmarea pentru ${booking.service}.`);
  else await showClientMenu(chatId, lang, lang === "ru" ? "Ссылка недействительна." : "Linkul nu mai este valabil.");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("ok");
    if (WEBHOOK_SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) return new Response("forbidden", { status: 403 });
    const update = await req.json();
    const message = update.message || update.edited_message;
    const callback = update.callback_query;
    const chatId = Number(callback?.message?.chat?.id ?? message?.chat?.id);
    if (!chatId) return new Response("ok");
    const user: TelegramUser = callback?.from || message?.from || {};
    const text = String(message?.text || message?.caption || "").trim();

    const start = text.match(/^\/start(?:\s+([A-Za-z0-9_-]+))?$/);
    if (start?.[1]) { await linkClientAppointment(chatId, start[1]); return new Response("ok"); }

    const adminCommand = text.match(/^\/(?:admin|setup)\s+([A-Za-z0-9_-]+)$/);
    if (adminCommand) {
      const ok = await registerAdmin(chatId, user, adminCommand[1]);
      await sendMessage(chatId, ok ? "✅ Contul Telegram a fost activat ca administrator." : "Cod de administrator invalid.", ok ? adminMenu : undefined);
      return new Response("ok");
    }

    const admin = await isAdmin(chatId);
    if (admin) {
      if (callback) await adminCallbackFlow(chatId, callback.id, String(callback.data || ""));
      else if (text === "/start" || text === "/menu") { await deleteDraft(chatId); await showAdminMenu(chatId); }
      else if (text) await adminTextFlow(chatId, text);
      return new Response("ok");
    }

    if (text === "/start") {
      await deleteDraft(chatId);
      await sendMessage(chatId, `${copy.ro.welcome}\n${copy.ru.welcome}`, languageKeyboard());
      return new Response("ok");
    }

    const lang = callback?.data?.startsWith("c:lang:") ? (callback.data.endsWith(":ru") ? "ru" : "ro") : await getClientLang(chatId);
    if (callback) await clientCallbackFlow(chatId, callback.id, String(callback.data || ""), user, lang);
    else if (text || message?.contact) await clientTextFlow(chatId, text, message, user, lang);
  } catch (error) {
    console.error("telegram-webhook", error instanceof Error ? error.message : String(error));
  }
  return new Response("ok");
});
