export function birthDateFromAge(age: number): string {
  const safe = Math.min(99, Math.max(18, Math.trunc(age)));
  const year = new Date().getFullYear() - safe;
  return `${year}-01-01`;
}

export function ageFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate) {
    return null;
  }
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    const year = Number(String(birthDate).slice(0, 4));
    if (!Number.isFinite(year) || year < 1920) {
      return null;
    }
    return new Date().getFullYear() - year;
  }
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}
