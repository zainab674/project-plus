export async function validateRequestBody(body, schema) {
    try {
      schema.parse(body);
      return [null,true]
    } catch (e) {
      return [e.message, false];
  }
}

export async function validateAndTransformRequestBody(body, schema) {
    try {
      const parsedData = schema.parse(body);
      return [null, parsedData]
    } catch (e) {
      return [e.message, false];
  }
}