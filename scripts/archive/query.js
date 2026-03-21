const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@127.0.0.1:54322/postgres');
client.connect()
  .then(() => client.query(`
    SELECT event_object_table AS table_name, trigger_name, action_statement 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public' 
    AND event_object_table IN ('transactions', 'transaction_items', 'loyalty_transactions', 'gift_card_ledger');
  `))
  .then(res => { 
    console.table(res.rows); 
    client.end(); 
  })
  .catch(err => {
    console.error(err);
    client.end();
  });