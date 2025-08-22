/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog',"N/ui/message"], (currentRecord, dialog, message) => {
  const SUBLIST_ID = 'recmachcustrecord_pr_parent';

  
  // Field IDs (update if your IDs differ)
  const FLD_ITEM   = 'custrecord_pr_item';
  const FLD_QTY    = 'custrecord_pr_qty';
  const FLD_RATE   = 'custrecord_pr_rate';
  const FLD_AMOUNT = 'custrecord_pr_amount';
  const FLD_STATUS = 'custrecord_pr_status';

  const HDR_BUDGET = 'custrecord_pr_budget_cap';
  const HDR_LOCK   = 'custrecord_pr_lock_lines';

  function lineInit(ctx) {

    debugger;
    if (ctx.sublistId !== SUBLIST_ID) return;

    const rec = ctx.currentRecord;
    // Start user off with Qty=1 and a clean Amount
    if (!rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_QTY })) 
    {
      rec.setCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_QTY, value: 1, ignoreFieldChange: true });
    }
    rec.setCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_AMOUNT, value: '', ignoreFieldChange: true });
  }

  function validateInsert(ctx) {
    // Called before a new line is inserted
    debugger;
    if (ctx.sublistId !== SUBLIST_ID) return true;

    const rec = ctx.currentRecord;
    const qty  = Number(rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_QTY }) || 0);
    const rate = Number(rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_RATE }) || 0);
    const lineTotal = round2(qty * rate);

    // Sum existing lines' amounts
    const existingTotal = getLinesTotal(rec);
    const budget = Number(rec.getValue(HDR_BUDGET) || 0);
    const willBeTotal = round2(existingTotal + lineTotal);

    if (budget && willBeTotal > budget) {
      
       dialog.alert({
        title: 'Over Budget',
        message: `Adding this line would exceed Budget Cap (${budget.toFixed(2)}). Current total: ${existingTotal.toFixed(2)}, new total would be: ${willBeTotal.toFixed(2)}.`
      });

      /* var myMsg = message.create({
            title: "Over Budget",
            message: `Adding this line would exceed Budget Cap (${budget.toFixed(2)}). Current total: ${existingTotal.toFixed(2)}, new total would be: ${willBeTotal.toFixed(2)}.`,
            type: message.Type.WARNING
        });
        myMsg.show({ duration : 1500 }) */
      return false;
    }
    return true;
  }

  function validateLine(ctx) {
    // Called when committing the current line (OK button / moving off line)
    debugger;
    if (ctx.sublistId !== SUBLIST_ID) return true;

    const rec = ctx.currentRecord;
    const item = rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_ITEM });
    const qty  = Number(rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_QTY }) || 0);
    const rate = Number(rec.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_RATE }) || 0);
    var currIndex = Number(rec.getCurrentSublistIndex({ sublistId: SUBLIST_ID}) || 0);

    // 1) Required + value checks
    if (!item) {
      dialog.alert({ title: 'Missing Item', message: 'Please select an Item.' });
      return false;
    }
    if (qty <= 0) {
      dialog.alert({ title: 'Invalid Quantity', message: 'Quantity must be greater than 0.' });
      return false;
    }
    if (rate <= 0) {
      dialog.alert({ title: 'Invalid Rate', message: 'Rate cannot be negative.' });
      return false;
    }

    // 2) No duplicate Items (simple business rule; change if duplicates are allowed)
    const lineCount = rec.getLineCount({ sublistId: SUBLIST_ID });
    for (let i = 0; i < lineCount; i++) 
    {

      if(i==currIndex) continue;

      const existingItemText = rec.getSublistText({ sublistId: SUBLIST_ID, fieldId: FLD_ITEM, line: i });
      const existingItem = rec.getSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_ITEM, line: i });
      
      log.debug("debug in validateLine", "existingItem : "+existingItem)
      log.debug("debug in validateLine", "item : "+item)
      
      if (existingItem && Number(existingItem) === Number(item)) 
      {
        dialog.alert({ title: 'Duplicate Item', message: 'This Item is already on another line.' });
        /*  var myMsg = message.create({
            title: "Duplicate Item",
            message: "This Item is already on another line.",
            type: message.Type.WARNING
        });
        myMsg.show({ duration : 1500 }) */
        return false;
      }
    }

    // 3) Compute Amount before commit
    const amount = round2(qty * rate);
    rec.setCurrentSublistValue({
      sublistId: SUBLIST_ID, fieldId: FLD_AMOUNT, value: amount, ignoreFieldChange: true
    });

    return true;
  }

  function validateDelete(ctx) {
    debugger;
    if (ctx.sublistId !== SUBLIST_ID) return true;

    const rec = ctx.currentRecord;

    // Block deletes if header is locked
    const locked = !!rec.getValue(HDR_LOCK);
    if (locked) {
      dialog.alert({ title: 'Locked', message: 'Lines are locked on this request and cannot be deleted.' });

     /*  var myMsg = message.create({
            title: "Locked",
            message: "Lines are locked on this request and cannot be deleted.",
            type: message.Type.WARNING
        });
        myMsg.show({ duration : 1500 }) */
      

      return false;
    }

    // Block deleting the only remaining line
    const lineCount = rec.getLineCount({ sublistId: SUBLIST_ID });
    if (lineCount <= 1) {
      dialog.alert({ title: 'At Least One Line Required', message: 'You must have at least one line on the request.' });
      
       /* var myMsg = message.create({
            title: "At Least One Line Required",
            message: "You must have at least one line on the request.",
            type: message.Type.WARNING
        });
        myMsg.show({ duration : 1500 }) */
      
      return false;
    }

    // Block deleting non-Draft lines
    const lineIdx = ctx.line; // index of the line being deleted
    const statusText = rec.getSublistText({ sublistId: SUBLIST_ID, fieldId: FLD_STATUS, line: lineIdx }) || '';
    if (statusText && statusText.toLowerCase() !== 'draft') {
      
       dialog.alert({ title: 'Cannot Delete', message: `Line status is "${statusText}". Only Draft lines can be deleted.` });
    
      /* var myMsg = message.create({
            title: "Cannot Delete",
            message: `Line status is "${statusText}". Only Draft lines can be deleted.` ,
            type: message.Type.WARNING
        });
        myMsg.show({ duration : 1500 }) */
      
      return false;
    }

    return true;
  }

  // --- helpers ---
  function getLinesTotal(rec) {
    const count = rec.getLineCount({ sublistId: SUBLIST_ID });
    let total = 0;
    for (let i = 0; i < count; i++) {
      const amt = Number(rec.getSublistValue({ sublistId: SUBLIST_ID, fieldId: FLD_AMOUNT, line: i }) || 0);
      total += amt;
    }
    return round2(total);
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  return { lineInit, validateInsert, validateLine, validateDelete };
});
