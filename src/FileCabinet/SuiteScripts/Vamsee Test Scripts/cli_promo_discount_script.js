/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog'], (currentRecord, dialog) => {
  function pageInit(ctx) {
    const rec = ctx.currentRecord;
    if (ctx.mode === 'create') {
      rec.setValue({ fieldId: 'custrecord_pdr_discount_pct', value: '' });
      rec.setValue({ fieldId: 'custrecord_pdr_need_approval', value: false });
    }
  }

  function fieldChanged(ctx) {
    const rec = ctx.currentRecord;
    const f = ctx.fieldId;

    if (f === 'custrecord_pdr_list_price' || f === 'custrecord_pdr_proposed_price') {
      const list = Number(rec.getValue('custrecord_pdr_list_price') || 0);
      const proposed = Number(rec.getValue('custrecord_pdr_proposed_price') || 0);

      if (list > 0 && proposed > 0) {
        const discPct = ((list - proposed) / list) * 100;
        rec.setValue({ fieldId: 'custrecord_pdr_discount_pct', value: Math.round(discPct * 100) / 100 });
        rec.setValue({ fieldId: 'custrecord_pdr_need_approval', value: discPct > 20 });
      } else {
        rec.setValue({ fieldId: 'custrecord_pdr_discount_pct', value: '' });
        rec.setValue({ fieldId: 'custrecord_pdr_need_approval', value: false });
      }
    }
  }

  function validateField(ctx) {
    const rec = ctx.currentRecord;

    if (ctx.fieldId === 'custrecord_pdr_proposed_price') {
      const val = Number(rec.getValue('custrecord_pdr_proposed_price') || 0);
      if (val <= 0) {
        dialog.alert({ title: 'Invalid Price', message: 'Proposed price must be greater than 0.' });
        return false;
      }
    }
    return true;
  }

  function saveRecord(ctx) {
    const rec = ctx.currentRecord;
    const needApproval = rec.getValue('custrecord_pdr_need_approval');
    const reason = (rec.getValue('custrecord_pdr_reason') || '').trim();

    if (needApproval && reason.length === 0) {
      dialog.alert({ title: 'Approval Reason Required', message: 'Provide a reason for discounts over 20%.' });
      return false;
    }
    return true;
  }

  return { pageInit, fieldChanged, validateField, saveRecord };
});
