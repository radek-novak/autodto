import { schemaFieldToAnyOf, schemaTransform } from "../../utils";
export const schema1 = {
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    user_id: {
      type: "string",
    },
    title: {
      type: "string",
    },
    body: {
      type: ["null", "string"],
    },
  },
};

console.log(
  schemaFieldToAnyOf(schema1.properties.body),
  schemaFieldToAnyOf(schema1.properties.id)
);

console.log(
  schemaTransform({ type: "string" }),
  schemaTransform({
    type: "object",
    properties: {
      user: {
        anyOf: [
          {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
              name: {
                type: ["string", "null"],
              },
              age: {
                type: "number",
              },
            },
            required: ["age", "id", "name"],
          },
          {
            type: "null",
          },
        ],
      },
    },
  })
);
