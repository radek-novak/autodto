type User = {
  id: string;
  age: number;
  name: string;
  email: string;
};

export function f(u: User) {
  const { id, ...rest } = u;
  // @autodto var x
  const userNoId = rest;

  return userNoId;
}
