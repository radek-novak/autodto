const allowedFields = new Set([
  "array",
  "boolean",
  "integer",
  "number",
  "object",
  "string",
]);

function isAllowedField(field: string) {
  return allowedFields.has(field);
}

export function schemaFieldToAnyOf(
  field: { type: unknown } | { type: string[] }
) {
  if (
    Array.isArray(field.type) &&
    field.type.length > 1 &&
    typeof field.type[0] === "string"
  ) {
    return {
      anyOf: field.type
        .map((type) => {
          return { type };
        })
        .filter((type) => isAllowedField(type.type)),
    };
  } else {
    return field;
  }
}

/**
 * Make transforms to the accepted JSON schema and return it.
 * Will mutate the original
 */
export function schemaTransform(schema: {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}) {
  // iterate over schema.properties
  if (schema.type !== "object" || !schema.properties) return schema;
  const keys = Object.keys(schema.properties ?? {});
  for (const key of keys) {
    schema.properties[key] = schemaFieldToAnyOf(schema.properties[key] as any);
  }
  return schema;
}
