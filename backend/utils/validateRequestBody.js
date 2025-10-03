export async function validateRequestBody(body, schema) {
    try {
      schema.parse(body);
      return [null,true]
    } catch (e) {
      return [e.message,false];
  }
}