/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/ui/message'], (currentRecord, dialog, message) => {
  const SUBLIST_ID = 'recmachcustrecord_er_line_parent';

  function pageInit(ctx) {
    // nothing special here, but you could default budget cap, etc.
  }

  function fieldChanged(ctx) {

    debugger;
    if (ctx.sublistId !== SUBLIST_ID) return;

    const rec = ctx.currentRecord;
    const fld = ctx.fieldId;

    if (fld === 'custrecord_er_line_amount' || fld === 'custrecord_er_line_taxcode') {
      const amount = Number(rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: 'custrecord_er_line_amount' }) || 0);
      const taxLabel = rec.getCurrentSublistText({ sublistId: SUBLIST_ID, fieldId: 'custrecord_er_line_taxcode' }) || '';

      // Expect labels like "GST 5%" or "GST 12%"
      const match = taxLabel.match(/(\d+(\.\d+)?)%/);
      const rate = match ? Number(match[1]) : 0;

      const taxAmt = Math.round((amount * rate / 100) * 100) / 100;
      const total = Math.round((amount + taxAmt) * 100) / 100;

      rec.setCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: 'custrecord_er_line_taxamt', value: taxAmt, ignoreFieldChange: true });
      rec.setCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: 'custrecord_er_line_total', value: total, ignoreFieldChange: true });
    }
  }

  function validateField(ctx) {

    debugger;

    if (ctx.sublistId !== SUBLIST_ID) return true;

    if (ctx.fieldId === 'custrecord_er_line_amount') {
      const rec = ctx.currentRecord;
      const amt = Number(rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: 'custrecord_er_line_amount' }) || 0);
      if (amt > 10000) 
      {

        //dialog.alert({ title: 'Per-line Limit', message: 'Each line cannot exceed 10,000.' });
     
        alert("Each line cannot exceed 10,000");

        /* var myMsg = message.create({
            title: "Per-line Limit",
            message: "Each line cannot exceed 10,000",
            type: message.Type.INFORMATION
        });
        myMsg.show({ duration : 1500 }) */
        return false;
      }
    }
    return true;
  }

  function saveRecord(ctx) {

    debugger;
    const rec = ctx.currentRecord;
    const budgetCap = Number(rec.getValue('custrecord_er_hdr_budget_cap') || 0);
    const lineCount = rec.getLineCount({ sublistId: SUBLIST_ID });

    let total = 0;
    for (let i = 0; i < lineCount; i++) {
      const lineTotal = Number(rec.getSublistValue({ sublistId: SUBLIST_ID, fieldId: 'custrecord_er_line_total', line: i }) || 0);
      total += lineTotal;
    }

    // Write header total for visibility (not strictly required to block save)
    rec.setValue({ fieldId: 'custrecord_er_hdr_total', value: Math.round(total * 100) / 100 });

    if (budgetCap && total > budgetCap) {
      /*dialog.alert({
        title: 'Over Budget',
        message: `Total ${total.toFixed(2)} exceeds budget cap ${budgetCap.toFixed(2)}.`
      });*/

      var myMsg = message.create({
          title: "Over Budget",
          message: `Total ${total.toFixed(2)} exceeds budget cap ${budgetCap.toFixed(2)}.`,
          type: message.Type.INFORMATION
      });
      myMsg.show({ duration : 1500 })
      
      return false;
    }


    return true;
  }

  return { pageInit, fieldChanged, validateField, saveRecord };
});
