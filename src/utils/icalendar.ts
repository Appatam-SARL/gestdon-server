// Générateur d'événement iCalendar (.ics) réutilisable
export interface ICalAlarm {
  trigger: string; // ex: -P1D, -PT1H
  desc: string;
}

export interface ICalEventOptions {
  title: string;
  description: string;
  start: Date | string;
  end: Date | string;
  url?: string;
  uid?: string;
  alarms?: ICalAlarm[];
}

function toICalDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateICalendarEvent({
  title,
  description,
  start,
  end,
  url,
  uid,
  alarms,
}: ICalEventOptions): string {
  const dtStart = toICalDate(start);
  const dtEnd = toICalDate(end);
  const dtStamp = dtStart;
  const eventUid = uid || `${Math.random().toString(36).slice(2)}@custom`;
  const defaultAlarms: ICalAlarm[] = [
    { trigger: '-P1D', desc: 'Rappel - 1 jour avant' },
    { trigger: '-PT12H', desc: 'Rappel - 12 heures avant' },
    { trigger: '-PT6H', desc: 'Rappel - 6 heures avant' },
    { trigger: '-PT1H', desc: 'Rappel - 1 heure avant' },
    { trigger: '-PT30M', desc: 'Rappel - 30 minutes avant' },
  ];
  const alarmsToUse = alarms ?? defaultAlarms;
  const alarmsBlock = alarmsToUse
    .map(
      (a) =>
        `BEGIN:VALARM\nTRIGGER:${a.trigger}\nACTION:DISPLAY\nDESCRIPTION:${a.desc}\nEND:VALARM`
    )
    .join('\\n');
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Custom//ICalendar//FR\nMETHOD:REQUEST\nBEGIN:VEVENT\nUID:${eventUid}\nDTSTAMP:${dtStamp}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nSUMMARY:${title}\nDESCRIPTION:${description}\n${
    url ? `URL:${url}\n` : ''
  }${alarmsBlock}\nEND:VEVENT\nEND:VCALENDAR`;
}
