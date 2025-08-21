/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/format'], (currentRecord, dialog, format) => {
  function pageInit(ctx) {
    if (ctx.mode === 'create') {
      const rec = ctx.currentRecord;
      rec.setValue({ fieldId: 'custrecord_cv_visit_date', value: new Date() });
    }
  }

  function fieldChanged(ctx) {
    const rec = ctx.currentRecord;
    const fld = ctx.fieldId;

    if (fld === 'custrecord_cv_checkin_date' || fld === 'custrecord_cv_checkout_date') {
      const checkIn = rec.getValue('custrecord_cv_checkin_date');   // string or Date depending on field type
      const checkOut = rec.getValue('custrecord_cv_checkout_date');

      if (!checkIn || !checkOut) return;

      // Parse NetSuite "Time Of Day" into Date objects for diff
      const inDate = format.parse({ type: format.Type.TIMEOFDAY, value: checkIn });
      const outDate = format.parse({ type: format.Type.TIMEOFDAY, value: checkOut });

      const mins = Math.round((outDate - inDate) / 60000); // could be negative if invalid
      if (mins >= 0) {
        rec.setValue({ fieldId: 'custrecord_cv_duration_mins', value: mins });
      } else {
        rec.setValue({ fieldId: 'custrecord_cv_duration_mins', value: '' });
      }
    }
  }

  function validateField(ctx) {
    const rec = ctx.currentRecord;

    if (ctx.fieldId === 'custrecord_cv_checkout_date') {
      const checkIn = rec.getValue('custrecord_cv_checkin_date');
      const checkOut = rec.getValue('custrecord_cv_checkout_date');
      if (checkIn && checkOut) {
        const inDate = format.parse({ type: format.Type.TIMEOFDAY, value: checkIn });
        const outDate = format.parse({ type: format.Type.TIMEOFDAY, value: checkOut });
        //alert("inDate : "+inDate);
        //alert("outDate : "+outDate);
        
        if (outDate <= inDate) {
          dialog.alert({ title: 'Time Range', message: 'Checkout must be after check-in.' });
          return false;
        }
      }
    }
    return true;
  }

  function saveRecord(ctx) {
    const rec = ctx.currentRecord;
    const needFollowUp = rec.getValue('custrecord_cv_requires_followup');
    const notes = rec.getValue('custrecord_cv_notes') || '';

    if (needFollowUp && notes.trim().length === 0) {
      dialog.alert({ title: 'Missing Notes', message: 'Please add notes for follow-up.' });
      return false;
    }
    return true;
  }

  return { pageInit, fieldChanged, saveRecord, validateField };
});
