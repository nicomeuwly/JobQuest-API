import { HttpError } from "./http-error";

export const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "Invalid date format");
  }

  return date;
};
