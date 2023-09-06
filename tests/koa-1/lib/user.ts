/**
 * get user
 */
export const getUser = async (id: string) => {
  return new Promise(
    (resolve: (opts: { id: string; name: string; age: number }) => void) => {
      setTimeout(() => {
        resolve({
          id,
          name: "John Doe",
          age: Math.floor(Math.random() * 99),
        });
      });
    }
  );
};
