/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log'], (log) => {
  const beforeSubmit = (ctx) => {
    try {
      // your logic
      log.debug('UE beforeSubmit', { type: ctx.type, id: ctx.newRecord.id });
    } catch (e) {
      log.error('UE error', e);
      throw e;
    }
  };
  return { beforeSubmit };
});
