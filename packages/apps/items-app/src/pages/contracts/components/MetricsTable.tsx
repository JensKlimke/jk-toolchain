import {useMemo} from "react";
import {Table} from "react-bootstrap";
import CurrencyCell from "../../../components/CurrencyCell";

export const MetricsTable = ({data}: { data: any }) => {
  // calculate sum
  const sum = useMemo<number>(() => {
    if (!data) return 0.0;
    return data.perMonth.reduce((sum: number, val: number) => sum + val, 0.0)
  }, [data]);
  // render table
  return (
    <Table hover borderless striped>
      <tbody>
      <tr>
        <td style={{'width': '40%'}}>Max. month</td>
        <td style={{'width': '60%'}} className='text-end'>
          <CurrencyCell amount={data.perMonth[data.maxMonth]}/>
        </td>
      </tr>
      <tr>
        <td>Average</td>
        <td className='text-end'>
          <CurrencyCell amount={data.monthlyAverage}/>
        </td>
      </tr>
      <tr>
        <td>Annual</td>
        <td className='text-end'>
          <CurrencyCell amount={sum}/>
        </td>
      </tr>
      <tr>
        <td>Shared</td>
        <td className='text-end'>
          <CurrencyCell amount={data.sharedAmount}/>
        </td>
      </tr>
      </tbody>
    </Table>
  )
}
