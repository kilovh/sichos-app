// How a sicha is matched across mafteiach and projectlikkuteisichos.org: volume, subject (parsha or moed,
// see subject.ts) and its number among that subject's sichos in the volume.
import { subject } from '../src/lib/catalog/subject.ts';

export const plsKey = (vol: number, heading: string, n = 1) => `${vol}|${subject(heading)}|${n}`;
