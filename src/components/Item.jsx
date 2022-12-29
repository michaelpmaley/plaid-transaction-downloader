import React from 'react';
import dayjs from 'dayjs';
import styles from './Item.css';

function Item(props) {
   const {item, download} = props;
   return(
      <tbody>
         <tr>
            <td>{item.name}</td>
            <td>{dayjs(item.lastDownloadDate).format('YYYY-MM-DD HH:MM')}</td>
            <td>
               <button onClick={download}>
                  ⬇️
               </button>
            </td>
            </tr>
      </tbody>
   );
};

export default Item;
