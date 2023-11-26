import _ from "lodash";
import { ExtractedType } from "../autodto";
import axios, { AxiosRequestConfig } from "axios";

const nameRe = /^[a-zA-Z_][a-zA-Z0-9_]+$/;
function validateName(name: string) {
  return nameRe.test(name);
}

const mapMethodToVerb = {
  post: "create",
  get: "fetch",
  put: "replace",
  patch: "update",
  delete: "remove",
};

function buildName(endpoint: ExtractedType) {
  const [method, path] = endpoint.parsedComment?.split(" ")!;

  const name = _.camelCase(
    mapMethodToVerb[method.toLowerCase() as keyof typeof mapMethodToVerb] +
      "_" +
      path.replace(/\\/g, "_")
  );

  console.assert(validateName(name), `Invalid name: ${name}`);

  return name;
}

export function buildEndpointMap(endpoints: ExtractedType[]) {
  const endpointData = {} as Record<
    string,
    { url: string; method: string; file?: string; typeString: string }
  >;

  for (const endpoint of endpoints) {
    const [method, path] = endpoint.parsedComment?.split(" ")!;
    const functionName = buildName(endpoint);

    endpointData[functionName] = { ...endpoint, method, url: path };
  }

  return endpointData;
}

export function buildClient<T extends Record<string, () => Promise<unknown>>>(
  endpointMap: ReturnType<typeof buildEndpointMap>
) {
  const client = {} as Record<string, (...args: any[]) => Promise<any>>;

  for (const [functionName, { method, url }] of Object.entries(endpointMap)) {
    client[functionName] = (config: AxiosRequestConfig) =>
      axios({
        method,
        url,
        ...config,
      }).then((r) => r.data);
  }

  return client as T;
}
// export function buildClient(
//   endpoints: ExtractedType[],
//   baseURL = "/",
//   axiosInstance = axios.create({ baseURL })
// ) {
//   const client = {} as Record<string, (...args: any[]) => Promise<any>>;
//   const endpointData = {} as Record<
//     string,
//     ExtractedType & { url: string; method: string }
//   >;

//   for (const endpoint of endpoints) {
//     const [method, path] = endpoint.parsedComment?.split(" ")!;
//     const functionName = buildName(endpoint);

//     client[functionName] = (config: AxiosRequestConfig) =>
//       axiosInstance({
//         method,
//         url: path,
//         ...config,
//       }).then((r) => r.data);

//     endpointData[functionName] = { ...endpoint, method, url: path };
//   }

//   return { client, endpoints: endpointData };
// }
