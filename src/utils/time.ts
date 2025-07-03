export const strToSec = (s: string) => {
  const [m, sec] = s.split(":").map(Number);
  return m * 60 + sec;
};
