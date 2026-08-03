import type { Classroom } from '../domain/types';

const CLASSROOMS_KEY = 'classroom-progress:custom-classrooms';
export const CLASSROOMS_CHANGED_EVENT = 'classroom-progress:classrooms-changed';

export function readCustomClassrooms(): Classroom[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(CLASSROOMS_KEY);
    return value ? (JSON.parse(value) as Classroom[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomClassrooms(classrooms: Classroom[]): void {
  window.localStorage.setItem(CLASSROOMS_KEY, JSON.stringify(classrooms));
  window.dispatchEvent(new Event(CLASSROOMS_CHANGED_EVENT));
}
