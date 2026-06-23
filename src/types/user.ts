export type User = {
  id: number;
  name: string | null;
  nickname: string;
  email: string;
  phone_number: string | null;
  city?: string | null;
  victory?: number;
  defeat?: number;
  trophies?: number;
  coins?: number;
  is_guest?: boolean;
};
