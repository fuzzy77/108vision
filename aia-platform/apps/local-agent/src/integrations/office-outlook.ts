import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const TIMEOUT_DEFAULT = 30_000;
const TIMEOUT_SEND = 60_000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface OutlookEmail {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  receivedAt: string;
  body: string;
  bodyPreview: string;
  isRead: boolean;
  hasAttachments: boolean;
  importance: 'low' | 'normal' | 'high';
}

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  location: string;
  body: string;
  isAllDay: boolean;
  organizer: string;
  attendees: string[];
}

export interface OutlookFolder {
  name: string;
  unreadCount: number;
  itemCount: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function runPs(script: string, timeoutMs: number): Promise<string> {
  const { stdout } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
  );
  return stdout;
}

function ps(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ''), '');
}

function escapePs(value: string): string {
  return value.replace(/'/g, "''");
}

function parseJson<T>(raw: string): T {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Empty PowerShell output');
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`Failed to parse PowerShell JSON output: ${trimmed.slice(0, 200)}`);
  }
}

function splitAddresses(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function mapImportance(raw: string | number | null | undefined): 'low' | 'normal' | 'high' {
  const val = String(raw ?? '').toLowerCase();
  if (val === '0' || val === 'low') return 'low';
  if (val === '2' || val === 'high') return 'high';
  return 'normal';
}

// ---------------------------------------------------------------------------
// Shared COM bootstrap (injected at the top of every script)
// ---------------------------------------------------------------------------

const COM_INIT = `
$ErrorActionPreference = 'Stop'
$outlook = $null
try {
  $outlook = New-Object -ComObject Outlook.Application
  $ns = $outlook.GetNamespace("MAPI")
`;

const COM_CLEANUP = `
} finally {
  if ($outlook -ne $null) {
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($outlook) | Out-Null
  }
}
`;

// ---------------------------------------------------------------------------
// listInbox
// ---------------------------------------------------------------------------

export async function listInbox(
  limit = 25,
  unreadOnly = false,
): Promise<OutlookEmail[]> {
  const script = ps`
${COM_INIT}
  $inbox = $ns.GetDefaultFolder(6)
  $items = $inbox.Items
  $items.Sort("[ReceivedTime]", $true)
  $filter = ${unreadOnly ? '"[Unread] = True"' : '$null'}
  if ($filter) { $items = $items.Restrict($filter) }
  $count = 0
  $limit = ${limit}
  $result = @()
  foreach ($item in $items) {
    if ($count -ge $limit) { break }
    if ($item -isnot [Microsoft.Office.Interop.Outlook.MailItemClass] -and $item.Class -ne 43) { continue }
    $result += [PSCustomObject]@{
      id             = $item.EntryID
      subject        = $item.Subject
      from           = $item.SenderEmailAddress
      to             = $item.To
      cc             = $item.CC
      receivedAt     = $item.ReceivedTime.ToUniversalTime().ToString("o")
      body           = $item.Body
      isRead         = -not $item.UnRead
      hasAttachments = ($item.Attachments.Count -gt 0)
      importance     = $item.Importance
    }
    $count++
  }
  $result | ConvertTo-Json -Depth 3 -Compress
${COM_CLEANUP}
`;

  const raw = await runPs(script, TIMEOUT_DEFAULT);
  const items = parseJson<Record<string, unknown>[]>(raw);
  if (!Array.isArray(items)) return [];
  return items.map(mapEmail);
}

// ---------------------------------------------------------------------------
// searchEmails
// ---------------------------------------------------------------------------

export async function searchEmails(
  query: string,
  folder = 'Inbox',
  limit = 25,
): Promise<OutlookEmail[]> {
  const safeQuery = escapePs(query);
  const safeFolder = escapePs(folder);

  const script = ps`
${COM_INIT}
  $inbox = $ns.GetDefaultFolder(6)
  $targetFolder = $inbox
  if ('${safeFolder}' -ne 'Inbox') {
    try { $targetFolder = $inbox.Folders.Item('${safeFolder}') } catch { $targetFolder = $inbox }
  }
  $items = $targetFolder.Items
  $items.Sort("[ReceivedTime]", $true)
  $daslFilter = "@SQL=" + [char]34 + "urn:schemas:httpmail:subject" + [char]34 + " LIKE '%" + '${safeQuery}' + "%' OR " + [char]34 + "urn:schemas:httpmail:textdescription" + [char]34 + " LIKE '%" + '${safeQuery}' + "%' OR " + [char]34 + "urn:schemas:httpmail:fromemail" + [char]34 + " LIKE '%" + '${safeQuery}' + "%'"
  $filtered = $items.Restrict($daslFilter)
  $count = 0
  $limit = ${limit}
  $result = @()
  foreach ($item in $filtered) {
    if ($count -ge $limit) { break }
    if ($item.Class -ne 43) { continue }
    $result += [PSCustomObject]@{
      id             = $item.EntryID
      subject        = $item.Subject
      from           = $item.SenderEmailAddress
      to             = $item.To
      cc             = $item.CC
      receivedAt     = $item.ReceivedTime.ToUniversalTime().ToString("o")
      body           = $item.Body
      isRead         = -not $item.UnRead
      hasAttachments = ($item.Attachments.Count -gt 0)
      importance     = $item.Importance
    }
    $count++
  }
  $result | ConvertTo-Json -Depth 3 -Compress
${COM_CLEANUP}
`;

  const raw = await runPs(script, TIMEOUT_DEFAULT);
  const items = parseJson<Record<string, unknown>[]>(raw);
  if (!Array.isArray(items)) return [];
  return items.map(mapEmail);
}

// ---------------------------------------------------------------------------
// readEmail
// ---------------------------------------------------------------------------

export async function readEmail(entryId: string): Promise<OutlookEmail> {
  const safeId = escapePs(entryId);

  const script = ps`
${COM_INIT}
  $item = $ns.GetItemFromID('${safeId}')
  if ($item.Class -ne 43) { throw "Item is not a MailItem" }
  [PSCustomObject]@{
    id             = $item.EntryID
    subject        = $item.Subject
    from           = $item.SenderEmailAddress
    to             = $item.To
    cc             = $item.CC
    receivedAt     = $item.ReceivedTime.ToUniversalTime().ToString("o")
    body           = $item.Body
    isRead         = -not $item.UnRead
    hasAttachments = ($item.Attachments.Count -gt 0)
    importance     = $item.Importance
  } | ConvertTo-Json -Depth 3 -Compress
${COM_CLEANUP}
`;

  const raw = await runPs(script, TIMEOUT_DEFAULT);
  const item = parseJson<Record<string, unknown>>(raw);
  return mapEmail(item);
}

// ---------------------------------------------------------------------------
// sendEmail
// ---------------------------------------------------------------------------

export async function sendEmail(
  to: string[],
  subject: string,
  body: string,
  cc: string[] = [],
  isHtml = false,
): Promise<void> {
  const safeTo = escapePs(to.join('; '));
  const safeCc = escapePs(cc.join('; '));
  const safeSubject = escapePs(subject);
  const safeBody = escapePs(body);
  const bodyFormat = isHtml ? '2' : '1'; // olFormatHTML=2, olFormatPlain=1

  const script = ps`
${COM_INIT}
  $mail = $outlook.CreateItem(0)
  $mail.To = '${safeTo}'
  $mail.CC = '${safeCc}'
  $mail.Subject = '${safeSubject}'
  $mail.BodyFormat = ${bodyFormat}
  if (${bodyFormat} -eq 2) { $mail.HTMLBody = '${safeBody}' } else { $mail.Body = '${safeBody}' }
  $mail.Send()
${COM_CLEANUP}
`;

  await runPs(script, TIMEOUT_SEND);
}

// ---------------------------------------------------------------------------
// replyEmail
// ---------------------------------------------------------------------------

export async function replyEmail(
  entryId: string,
  body: string,
  replyAll = false,
): Promise<void> {
  const safeId = escapePs(entryId);
  const safeBody = escapePs(body);
  const replyMethod = replyAll ? 'ReplyAll' : 'Reply';

  const script = ps`
${COM_INIT}
  $original = $ns.GetItemFromID('${safeId}')
  if ($original.Class -ne 43) { throw "Item is not a MailItem" }
  $reply = $original.${replyMethod}()
  $sep = [Environment]::NewLine + [Environment]::NewLine
  $reply.Body = '${safeBody}' + $sep + $reply.Body
  $reply.Send()
${COM_CLEANUP}
`;

  await runPs(script, TIMEOUT_SEND);
}

// ---------------------------------------------------------------------------
// markRead
// ---------------------------------------------------------------------------

export async function markRead(entryId: string, read = true): Promise<void> {
  const safeId = escapePs(entryId);
  const unread = read ? '$false' : '$true';

  const script = ps`
${COM_INIT}
  $item = $ns.GetItemFromID('${safeId}')
  $item.UnRead = ${unread}
  $item.Save()
${COM_CLEANUP}
`;

  await runPs(script, TIMEOUT_DEFAULT);
}

// ---------------------------------------------------------------------------
// moveToFolder
// ---------------------------------------------------------------------------

export async function moveToFolder(entryId: string, folderName: string): Promise<void> {
  const safeId = escapePs(entryId);
  const safeName = escapePs(folderName);

  const script = ps`
${COM_INIT}
  $item = $ns.GetItemFromID('${safeId}')
  $inbox = $ns.GetDefaultFolder(6)
  $target = $null
  foreach ($f in $inbox.Folders) {
    if ($f.Name -eq '${safeName}') { $target = $f; break }
  }
  if ($target -eq $null) {
    $target = $inbox.Folders.Add('${safeName}')
  }
  $item.Move($target) | Out-Null
${COM_CLEANUP}
`;

  await runPs(script, TIMEOUT_DEFAULT);
}

// ---------------------------------------------------------------------------
// listEvents
// ---------------------------------------------------------------------------

export async function listEvents(
  startDate: string,
  endDate: string,
): Promise<OutlookCalendarEvent[]> {
  const safeStart = escapePs(startDate);
  const safeEnd = escapePs(endDate);

  const script = ps`
${COM_INIT}
  $cal = $ns.GetDefaultFolder(9)
  $items = $cal.Items
  $items.IncludeRecurrences = $true
  $items.Sort("[Start]")
  $filter = "[Start] >= '${safeStart}' AND [End] <= '${safeEnd}'"
  $filtered = $items.Restrict($filter)
  $result = @()
  foreach ($item in $filtered) {
    $attendees = @()
    foreach ($r in $item.Recipients) { $attendees += $r.Address }
    $result += [PSCustomObject]@{
      id         = $item.EntryID
      subject    = $item.Subject
      start      = $item.Start.ToUniversalTime().ToString("o")
      end        = $item.End.ToUniversalTime().ToString("o")
      location   = $item.Location
      body       = $item.Body
      isAllDay   = $item.AllDayEvent
      organizer  = $item.Organizer
      attendees  = $attendees
    }
  }
  $result | ConvertTo-Json -Depth 4 -Compress
${COM_CLEANUP}
`;

  const raw = await runPs(script, TIMEOUT_DEFAULT);
  const items = parseJson<Record<string, unknown>[]>(raw);
  if (!Array.isArray(items)) return [];
  return items.map(mapEvent);
}

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------

export async function createEvent(
  subject: string,
  start: string,
  end: string,
  body = '',
  location = '',
  attendees: string[] = [],
): Promise<string> {
  const safeSubject = escapePs(subject);
  const safeBody = escapePs(body);
  const safeLocation = escapePs(location);
  const attendeeLines = attendees
    .map((a) => `$appt.Recipients.Add('${escapePs(a)}') | Out-Null`)
    .join('\n');

  const script = ps`
${COM_INIT}
  $appt = $outlook.CreateItem(1)
  $appt.Subject = '${safeSubject}'
  $appt.Body = '${safeBody}'
  $appt.Location = '${safeLocation}'
  $appt.Start = [DateTime]::Parse('${escapePs(start)}')
  $appt.End = [DateTime]::Parse('${escapePs(end)}')
  ${attendeeLines}
  $appt.Save()
  $appt.EntryID
${COM_CLEANUP}
`;

  const raw = await runPs(script, TIMEOUT_DEFAULT);
  return raw.trim();
}

// ---------------------------------------------------------------------------
// listFolders
// ---------------------------------------------------------------------------

export async function listFolders(): Promise<OutlookFolder[]> {
  const script = ps`
${COM_INIT}
  function Get-FolderInfo($folder, $depth) {
    $result = @()
    $result += [PSCustomObject]@{
      name        = $folder.Name
      unreadCount = $folder.UnReadItemCount
      itemCount   = $folder.Items.Count
    }
    if ($depth -lt 2) {
      foreach ($sub in $folder.Folders) {
        $result += Get-FolderInfo $sub ($depth + 1)
      }
    }
    return $result
  }
  $inbox = $ns.GetDefaultFolder(6)
  $all = Get-FolderInfo $inbox 0
  $all | ConvertTo-Json -Depth 4 -Compress
${COM_CLEANUP}
`;

  const raw = await runPs(script, TIMEOUT_DEFAULT);
  const items = parseJson<Record<string, unknown>[]>(raw);
  if (!Array.isArray(items)) return [];
  return items.map((f) => ({
    name: String(f['name'] ?? ''),
    unreadCount: Number(f['unreadCount'] ?? 0),
    itemCount: Number(f['itemCount'] ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// Internal mappers
// ---------------------------------------------------------------------------

function mapEmail(raw: Record<string, unknown>): OutlookEmail {
  const body = String(raw['body'] ?? '');
  const plainPreview = body.replace(/\s+/g, ' ').slice(0, 200);

  return {
    id: String(raw['id'] ?? ''),
    subject: String(raw['subject'] ?? ''),
    from: String(raw['from'] ?? ''),
    to: splitAddresses(raw['to'] as string | null),
    cc: splitAddresses(raw['cc'] as string | null),
    receivedAt: String(raw['receivedAt'] ?? ''),
    body,
    bodyPreview: plainPreview,
    isRead: Boolean(raw['isRead']),
    hasAttachments: Boolean(raw['hasAttachments']),
    importance: mapImportance(raw['importance'] as string | number | null),
  };
}

function mapEvent(raw: Record<string, unknown>): OutlookCalendarEvent {
  const rawAttendees = raw['attendees'];
  const attendees: string[] = Array.isArray(rawAttendees)
    ? rawAttendees.map(String)
    : splitAddresses(rawAttendees as string | null);

  return {
    id: String(raw['id'] ?? ''),
    subject: String(raw['subject'] ?? ''),
    start: String(raw['start'] ?? ''),
    end: String(raw['end'] ?? ''),
    location: String(raw['location'] ?? ''),
    body: String(raw['body'] ?? ''),
    isAllDay: Boolean(raw['isAllDay']),
    organizer: String(raw['organizer'] ?? ''),
    attendees,
  };
}
