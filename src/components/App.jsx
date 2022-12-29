import React, { useCallback, useEffect, useState } from 'react';
import Items from './Items.jsx';
import { usePlaidLink } from 'react-plaid-link';
import PlaidService from '../services/PlaidService';
import TransactionHelper from '../utils/TransactionHelper';
import dayjs from 'dayjs';
import styles from './App.css';

function App(props) {
   const [plaidHeaders, setPlaidHeaders] = useState(props.plaidConfig?.headers);
   const [plaidItems, setPlaidItems] = useState(props.plaidConfig?.items);
   const [plaidLinkToken, setPlaidLinkToken] = useState(null);
   const [mappings, setMappings] = useState(props.mappings);
   const isOauth = window.location.href.includes('?oauth_state_id='); // will be true on redirect
   const plaidService = new PlaidService(plaidHeaders);
   const transactionHelper = new TransactionHelper(mappings);

   // create a Plaid link token (on oauth redirect, use cached localstorage value)
   const createPlaidLinkToken = useCallback(async () => {
      if (!isOauth) {
         const linkToken = await plaidService.createLinkToken(window.location.href.replace('http','https'));
         if (!linkToken) {
            return;
         }
         setPlaidLinkToken(linkToken);
         localStorage.setItem('plaid_link_token', linkToken);
      } else {
         const linkToken = localStorage.getItem('plaid_link_token');
         setPlaidLinkToken(linkToken);
      }
   }, [plaidLinkToken, setPlaidLinkToken, plaidService]);

   // handle Plaid link success (add a new Plaid item)
   const onPlaidLinkSuccess = useCallback(async (publicToken, metadata) => {
      if (!metadata.account) {
         console.log(`ERROR: failed get account information ${JSON.stringify(metadata)}`);
         return;
      }
      const id = metadata.account.id;
      const name = `${metadata.institution.name} ${metadata.account.name}`;
      const accessToken = await plaidService.getAccessToken(publicToken);
      if (!accessToken) {
         return;
      }
      const item = { "id": id, "name": name, "pubicToken": publicToken, "accessToken": accessToken, "lastDownloadDate": "2000-01-01T01:00:00.000Z" };
      const items = plaidItems ? plaidItems.slice() : [];
      items.push(item);
      setPlaidItems(items); // update ui
      await window.ipc.addPlaidItem(item); // save to disk
   }, [plaidItems, setPlaidItems, plaidService]);

   // handle Plaid transaction download request
   const handlePlaidDownloadRequest = useCallback(async (id) => {
      const now = dayjs();
      const items = plaidItems.slice();
      const item = items.find(it => it.id == id);
      const {cursor, transactions} = await plaidService.downloadTransactions(item);
      if (cursor === null) {
         return;
      }
      if (transactions.length === 0) {
         console.log(`INFO: no transactions to download for ${item.name}`)
         return;
      }

      const mappedTransactions = transactionHelper.mapTransactions(transactions);
      const csvContent = transactionHelper.convertToCSV(mappedTransactions);
      const csvFileName = `${item.name} ${now.format('YYYY-MM-DD-HH-mm')}.csv`;
      await window.ipc.saveCSVFile(csvFileName, csvContent); // save to disk

      item.lastDownloadDate = now.toISOString();
      item.cursor = cursor;
      setPlaidItems(items); // update ui
      await window.ipc.updatePlaidItem(item); // save to disk
   }, [plaidItems, setPlaidItems, plaidService, transactionHelper]);


   // startup
   // 2. create link component
   const plaidLinkOptions = {
      "token": plaidLinkToken,
      "onSuccess": onPlaidLinkSuccess,
      ...(isOauth && {"receivedRedirectUri": window.location.href})
   };
   const { open: openPlaidLink, ready: isPlaidLinkReady } = usePlaidLink(plaidLinkOptions);

   useEffect(() => {
      // 1. create the link token
      if (plaidLinkToken == null) {
         createPlaidLinkToken();
      }
      // 3. on oauth redirect, reinitialize link component
      if (isOauth && isPlaidLinkReady) {
         openPlaidLink();
      }
   }, [plaidLinkToken, isOauth, openPlaidLink, isPlaidLinkReady]);


   return (
      <div>
         <div className='gnav'>
            <button onClick={() => openPlaidLink()} disabled={!isPlaidLinkReady}>
               ⇆ Connect a bank account
            </button>
         </div>
         <Items items={plaidItems} download={(i) => handlePlaidDownloadRequest(i)} />
      </div>
   );
};

export default App;
