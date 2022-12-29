import React from 'react';
import Item from './Item.jsx';
import styles from './Items.css';

function Items(props) {
   if (!props.items || props.items.length === 0) {
      return "";
   }

   return (
      <div>
         <table>
               <thead>
                  <tr>
                     <th>Name</th>
                     <th>Last Download Date</th>
                     <th>Actions</th>
                  </tr>
               </thead>
               {props.items.map(item => <Item key={item.id} item={item} download={() => props.download(item.id)} />)}
         </table>
      </div>
   );
};

export default Items;
