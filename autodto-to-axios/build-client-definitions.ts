import fs from "fs";
import path from "path";

interface AutodtoEndpointData {
  [functionName: string]: { typeString: string };
}

export default function buildClientDefinitions(endpoints: AutodtoEndpointData) {
  let typingsContent = 'import axios from "axios";\n\n';
  typingsContent += "declare const client: {\n";
  for (const [functionName, { typeString }] of Object.entries(endpoints)) {
    typingsContent += `  ${functionName}: (config?: axios.AxiosRequestConfig) => Promise<${typeString}>;\n`;
  }
  typingsContent += "};\n\nexport default client;";

  return typingsContent;
  // fs.writeFileSync(options.path ?? "client.d.ts", typingsContent);
}

// const endpoints = fs.readFileSync(
//   path.join(__dirname, "/tests/file-1.json"),
//   "utf-8"
// );

// buildClientDefinitions(JSON.parse(endpoints), {});
