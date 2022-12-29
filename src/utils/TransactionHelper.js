export default class TransactionHelper {
   constructor(mappings) {
      this.mappings = mappings;
      this.mappingKeys = mappings ? Object.keys(mappings) : null;
   }

   /***
    * Normalize and map transactions
    */
   mapTransactions(ofxTransactions) {
      const transactions = ofxTransactions
         .filter(t => t.pending == false)
         .map(t => {
            const date = t.date;
            let payee = t.merchant_name ? t.merchant_name : t.name;
            let category = '';
            const amount = t.iso_currency_code === 'USD' ? t.amount.toString() : `${t.amount} ${t.iso_currency_code}`;
            const notes = `${t.name} ${t.payment_channel} ${t.location.city ? ' ' + t.location.address + ' ' + t.location.city + t.location.region : ''} ${t.transaction_id}`.replaceAll(',',' ').trim();
            const checkNumber = t.check_number ? t.check_number : '';
            const id = t.transaction_id;

            const mappingKey = this.mappingKeys?.find(k => {return payee.match(k) !== null;});
            if (mappingKey) {
               payee = this.mappings[mappingKey].payee;
               category = this.mappings[mappingKey].category;
            }

            return { date, payee, category, amount, notes, checkNumber, id };
         });

      return transactions;
   }

   /***
    * Convert transactions to CSV format
    */
   convertToCSV(transactions) {
      const data = transactions.map(t => { return `${t.date},${t.payee},${t.category},${t.amount},${t.notes},${t.checkNumber},${t.id}`; });
      const content = `Date,Payee,Category,Amount,Notes,CheckNumber,Id\n${data.join('\n')}`;
      return content;
   }

}

/***
 * ofxTransaction example
 {
   "account_id": "wBgkLJV9AjCGz5oJyNAdcyo5kGZ7V6hlg8nyy",
   "account_owner": null,
   "amount": 5.4,
   "authorized_date": "2022-10-01",
   "authorized_datetime": null,
   "category": [
      "Travel",
      "Taxi"
   ],
   "category_id": "22016000",
   "check_number": null,
   "date": "2022-10-02",
   "datetime": null,
   "iso_currency_code": "USD",
   "location": {
      "address": null,
      "city": null,
      "country": null,
      "lat": null,
      "lon": null,
      "postal_code": null,
      "region": null,
      "store_number": null
   },
   "merchant_name": "Uber",
   "name": "Uber 063015 SF**POOL**",
   "payment_channel": "in store",
   "payment_meta": {
      "by_order_of": null,
      "payee": null,
      "payer": null,
      "payment_method": null,
      "payment_processor": null,
      "ppd_id": null,
      "reason": null,
      "reference_number": null
   },
   "pending": false,
   "pending_transaction_id": null,
   "personal_finance_category": null,
   "transaction_code": null,
   "transaction_id": "PMm1gopXe5ubAMlW3qv1fNrRXeLrKNiNwJzgk",
   "transaction_type": "special",
   "unofficial_currency_code": null
},
 */