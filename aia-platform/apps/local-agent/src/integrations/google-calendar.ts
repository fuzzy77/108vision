/**
 * Google Calendar API v3 adapter for the 108 AI Desktop Agent.
 *
 * Uses native fetch. No external dependencies.
 * All times default to Europe/Rome unless the caller overrides timeZone.
 */

const BASE_URL = 'https://www.googleapis.com/calendar/v3';
const DEFAULT_TIMEZONE = 'Europe/Rome';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;        // ISO datetime (or YYYY-MM-DD for all-day)
  end: string;          // ISO datetime (or YYYY-MM-DD for all-day)
  location: string;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  organizer: string;
  attendees: Array<{ email: string; name?: string; status: string }>;
  meetLink?: string;
  calendarId: string;
  recurring: boolean;
}

export interface CalendarList {
  id: string;
  name: string;
  primary: boolean;
  color: string;
}

export interface CreateEventParams {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  attendees?: string[];
  calendarId?: string;
}

export interface UpdateEventParams {
  title?: string;
  start?: string;
  end?: string;
  description?: string;
  location?: string;
}

// ---------------------------------------------------------------------------
// Internal: raw Google API shapes (minimal — only what we map)
// ---------------------------------------------------------------------------

interface GCalDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

interface GCalAttendee {
  email: string;
  displayName?: string;
  responseStatus: string;
}

interface GCalConferenceEntryPoint {
  uri: string;
}

interface GCalConferenceData {
  entryPoints?: GCalConferenceEntryPoint[];
}

interface GCalEvent {
  id: string;
  summary?: string;
  description?: string;
  start: GCalDateTime;
  end: GCalDateTime;
  location?: string;
  status?: string;
  organizer?: { email?: string; displayName?: string };
  attendees?: GCalAttendee[];
  hangoutLink?: string;
  conferenceData?: GCalConferenceData;
  recurringEventId?: string;
  // injected by our mapping helpers — not part of the API response
  _calendarId?: string;
}

interface GCalEventListResponse {
  items?: GCalEvent[];
}

interface GCalCalendarListEntry {
  id: string;
  summary?: string;
  primary?: boolean;
  backgroundColor?: string;
}

interface GCalCalendarListResponse {
  items?: GCalCalendarListEntry[];
}

interface GCalFreeBusyCalendar {
  busy?: Array<{ start: string; end: string }>;
}

interface GCalFreeBusyResponse {
  calendars?: Record<string, GCalFreeBusyCalendar>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(
  accessToken: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: authHeaders(accessToken),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google Calendar API error ${response.status}: ${text}`);
  }

  // DELETE returns 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Detect whether a string is a date-only value (YYYY-MM-DD). */
function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Build a GCalDateTime block from an ISO string, respecting all-day format. */
function toGCalDateTime(iso: string, timeZone: string): GCalDateTime {
  if (isDateOnly(iso)) {
    return { date: iso };
  }
  return { dateTime: iso, timeZone };
}

function mapStatus(status: string | undefined): CalendarEvent['status'] {
  if (status === 'tentative') return 'tentative';
  if (status === 'cancelled') return 'cancelled';
  return 'confirmed';
}

function extractMeetLink(event: GCalEvent): string | undefined {
  if (event.hangoutLink) return event.hangoutLink;
  const entryPoints = event.conferenceData?.entryPoints;
  if (entryPoints && entryPoints.length > 0) {
    return entryPoints[0]?.uri;
  }
  return undefined;
}

function mapEvent(raw: GCalEvent, calendarId: string): CalendarEvent {
  const startRaw = raw.start.dateTime ?? raw.start.date ?? '';
  const endRaw = raw.end.dateTime ?? raw.end.date ?? '';
  const isAllDay = isDateOnly(startRaw);

  return {
    id: raw.id,
    title: raw.summary ?? '',
    description: raw.description ?? '',
    start: startRaw,
    end: endRaw,
    location: raw.location ?? '',
    isAllDay,
    status: mapStatus(raw.status),
    organizer: raw.organizer?.email ?? raw.organizer?.displayName ?? '',
    attendees: (raw.attendees ?? []).map((a) => ({
      email: a.email,
      name: a.displayName,
      status: a.responseStatus,
    })),
    meetLink: extractMeetLink(raw),
    calendarId: raw._calendarId ?? calendarId,
    recurring: raw.recurringEventId !== undefined,
  };
}

/** Returns the local date boundaries for a given day offset (0 = today, 1 = tomorrow…). */
function dayBoundary(
  offsetDays: number,
  timeZone: string = DEFAULT_TIMEZONE,
): { timeMin: string; timeMax: string } {
  const now = new Date();

  // Build a date in the target timezone using Intl
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // "en-CA" gives YYYY-MM-DD directly
  const parts = formatter.format(now);
  const [year, month, day] = parts.split('-').map(Number) as [number, number, number];

  const base = new Date(Date.UTC(year, month - 1, day + offsetDays));
  const timeMin = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0)).toISOString();
  const timeMax = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 23, 59, 59, 999)).toISOString();
  return { timeMin, timeMax };
}

/** Sunday boundary for the current week (Mon-Sun or today→Sun). */
function weekBoundary(timeZone: string = DEFAULT_TIMEZONE): { timeMin: string; timeMax: string } {
  const todayBounds = dayBoundary(0, timeZone);

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const formatted = formatter.formatToParts(now);
  const weekdayPart = formatted.find((p) => p.type === 'weekday');
  const weekdayName = weekdayPart?.value ?? 'Sun';

  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const todayIndex = weekdayMap[weekdayName] ?? 0;
  const daysToSunday = todayIndex === 0 ? 0 : 7 - todayIndex;

  const sundayBounds = dayBoundary(daysToSunday, timeZone);

  return { timeMin: todayBounds.timeMin, timeMax: sundayBounds.timeMax };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listEvents(
  accessToken: string,
  options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    calendarId?: string;
    query?: string;
    timeZone?: string;
  },
): Promise<CalendarEvent[]> {
  const calendarId = options?.calendarId ?? 'primary';
  const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;
  const now = new Date();
  const todayEnd = dayBoundary(0, timeZone).timeMax;

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: options?.timeMin ?? now.toISOString(),
    timeMax: options?.timeMax ?? todayEnd,
    maxResults: String(options?.maxResults ?? 10),
    timeZone,
  });
  if (options?.query) params.set('q', options.query);

  const path = `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
  const data = await apiFetch<GCalEventListResponse>(accessToken, 'GET', path);

  return (data.items ?? []).map((e) => mapEvent(e, calendarId));
}

export async function getTodayEvents(accessToken: string, timeZone?: string): Promise<CalendarEvent[]> {
  const tz = timeZone ?? DEFAULT_TIMEZONE;
  const { timeMin, timeMax } = dayBoundary(0, tz);
  return listEvents(accessToken, { timeMin, timeMax, maxResults: 50, timeZone: tz });
}

export async function getTomorrowEvents(accessToken: string, timeZone?: string): Promise<CalendarEvent[]> {
  const tz = timeZone ?? DEFAULT_TIMEZONE;
  const { timeMin, timeMax } = dayBoundary(1, tz);
  return listEvents(accessToken, { timeMin, timeMax, maxResults: 50, timeZone: tz });
}

export async function getWeekEvents(accessToken: string, timeZone?: string): Promise<CalendarEvent[]> {
  const tz = timeZone ?? DEFAULT_TIMEZONE;
  const { timeMin, timeMax } = weekBoundary(tz);
  return listEvents(accessToken, { timeMin, timeMax, maxResults: 250, timeZone: tz });
}

export async function getEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary',
): Promise<CalendarEvent> {
  const path = `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const raw = await apiFetch<GCalEvent>(accessToken, 'GET', path);
  return mapEvent(raw, calendarId);
}

export async function createEvent(
  accessToken: string,
  params: CreateEventParams,
): Promise<CalendarEvent> {
  const calendarId = params.calendarId ?? 'primary';
  const timeZone = DEFAULT_TIMEZONE;

  const body: Record<string, unknown> = {
    summary: params.title,
    start: toGCalDateTime(params.start, timeZone),
    end: toGCalDateTime(params.end, timeZone),
  };
  if (params.description !== undefined) body['description'] = params.description;
  if (params.location !== undefined) body['location'] = params.location;
  if (params.attendees && params.attendees.length > 0) {
    body['attendees'] = params.attendees.map((email) => ({ email }));
  }

  const path = `/calendars/${encodeURIComponent(calendarId)}/events`;
  const raw = await apiFetch<GCalEvent>(accessToken, 'POST', path, body);
  return mapEvent(raw, calendarId);
}

export async function updateEvent(
  accessToken: string,
  eventId: string,
  params: UpdateEventParams,
  calendarId: string = 'primary',
): Promise<CalendarEvent> {
  const timeZone = DEFAULT_TIMEZONE;
  const body: Record<string, unknown> = {};

  if (params.title !== undefined) body['summary'] = params.title;
  if (params.description !== undefined) body['description'] = params.description;
  if (params.location !== undefined) body['location'] = params.location;
  if (params.start !== undefined) body['start'] = toGCalDateTime(params.start, timeZone);
  if (params.end !== undefined) body['end'] = toGCalDateTime(params.end, timeZone);

  const path = `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const raw = await apiFetch<GCalEvent>(accessToken, 'PATCH', path, body);
  return mapEvent(raw, calendarId);
}

export async function deleteEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary',
): Promise<void> {
  const path = `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  await apiFetch<void>(accessToken, 'DELETE', path);
}

export async function moveEvent(
  accessToken: string,
  eventId: string,
  newStart: string,
  newEnd: string,
  calendarId: string = 'primary',
): Promise<CalendarEvent> {
  return updateEvent(accessToken, eventId, { start: newStart, end: newEnd }, calendarId);
}

export async function listCalendars(accessToken: string): Promise<CalendarList[]> {
  const data = await apiFetch<GCalCalendarListResponse>(accessToken, 'GET', '/users/me/calendarList');

  return (data.items ?? []).map((c) => ({
    id: c.id,
    name: c.summary ?? '',
    primary: c.primary ?? false,
    color: c.backgroundColor ?? '',
  }));
}

export async function checkAvailability(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarIds: string[] = ['primary'],
): Promise<Array<{ start: string; end: string }>> {
  const body = {
    timeMin,
    timeMax,
    items: calendarIds.map((id) => ({ id })),
  };

  const data = await apiFetch<GCalFreeBusyResponse>(accessToken, 'POST', '/freeBusy', body);

  const busy: Array<{ start: string; end: string }> = [];
  if (data.calendars) {
    for (const calId of calendarIds) {
      const calData = data.calendars[calId];
      if (calData?.busy) {
        for (const period of calData.busy) {
          busy.push({ start: period.start, end: period.end });
        }
      }
    }
  }

  // Sort by start time
  busy.sort((a, b) => a.start.localeCompare(b.start));
  return busy;
}

export async function quickAdd(
  accessToken: string,
  text: string,
  calendarId: string = 'primary',
): Promise<CalendarEvent> {
  const params = new URLSearchParams({ text });
  const path = `/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?${params.toString()}`;
  const raw = await apiFetch<GCalEvent>(accessToken, 'POST', path);
  return mapEvent(raw, calendarId);
}
