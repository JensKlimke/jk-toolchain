import {Table} from "react-bootstrap";
import CurrencyCell from "../../../components/CurrencyCell";

export const MonthsTable = ({data}: { data: any }) => {
  // function to month name
  const toMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber);
    return date.toLocaleString('en-US', {
      month: 'long',
    });
  }
  return (
    <Table hover borderless striped>
      <tbody>
      {
        data.perMonth.map((m: any, i: number) => (
          <tr key={i}>
            <th scope='row'>{toMonthName(i)}</th>
            <td className='text-end'>
              {(i === data.maxMonth && m > 0.0) ?
                <u><CurrencyCell amount={m}/></u> :
                <CurrencyCell amount={m}/>
              }
            </td>
          </tr>
        ))
      }
      </tbody>
    </Table>
  )
}
