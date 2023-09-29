type Profile = {
  banner_url: string;
  profile_url: string;
};

type User = {
  id: string;
  age: number;
  name: string;
  email: string;
  profile?: Profile;
};

export function f(u: User) {
  const { id, ...rest } = u;
  // @autodto var x
  const userNoId = rest;

  return userNoId;
}
