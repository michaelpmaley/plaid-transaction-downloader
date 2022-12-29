import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export default class PlaidService {
   constructor(headers) {
      this.headers = headers;

      // instantiate client
      const clientConfig = new Configuration({
         basePath: PlaidEnvironments[headers?.environment],
         baseOptions: {
            headers: {
               "PLAID-CLIENT-ID": headers?.clientId,
               "PLAID-SECRET": headers?.secret,
               "Plaid-Version": "2020-09-14",
            },
         },
      });
      this.client = headers ? new PlaidApi(clientConfig) : null;
   }

   /***
    * Create link token
    */
   async createLinkToken(redirectUri) {
      try {
         const response = await this.client?.linkTokenCreate({
            "user": { "client_user_id": '1' }, // user id
            "client_name": this.headers?.clientName,
            "language": 'en',
            "products": ['auth', 'transactions'],
            "country_codes": ['US'],
            "redirect_uri": redirectUri,
         });
         return response.data.link_token;
      } catch (error) {
         console.log(error);
         return null;
      }
   }

   /***
    * Exchange public token for access token
    */
   async getAccessToken(publicToken) {
      try {
         const response = await this.client?.itemPublicTokenExchange({ "public_token": publicToken, });
         return response.data.access_token;
      } catch (error) {
         console.log(error);
         return null;
      }
   }

   /***
    * Download transactions using cursor
    * Only capturing added transactions, *not* modified or deleted
    */
   async downloadTransactions(item) {
      try {
         const accessToken = item.accessToken;
         let transactions = [];
         let cursor = item.cursor ? item.cursor : null;
         let hasMore = true;
         while (hasMore) {
            const response = await this.client?.transactionsSync({ "access_token": accessToken, "cursor": cursor, });
            const data = response.data;
            transactions = transactions.concat(data.added);
            hasMore = data.has_more;
            cursor = data.next_cursor;
         }
         return {"cursor": cursor, "transactions": transactions};
      } catch (error) {
         console.log(error);
         return { "cursor": null, "transactions": [] };
      }
   }

}
