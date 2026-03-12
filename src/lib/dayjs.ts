import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/pt-br';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.locale('pt-br');

export default dayjs;
