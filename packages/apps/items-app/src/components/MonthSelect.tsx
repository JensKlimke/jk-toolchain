import {useCallback, useEffect, useState} from "react";
import {Button, Form} from "react-bootstrap";
import moment from "moment";


function MonthButton({active, name, onSelect}: { active: boolean, name: string, onSelect: (active: boolean) => void }) {
  // states
  const [isActive, setActive] = useState(active);
  // effects
  useEffect(() => {
    setActive(active);
  }, [active])
  // callbacks
  const handleSelect = useCallback(() => {
    const state = !isActive;
    setActive(state)
    onSelect(state);
  }, [isActive, onSelect]);
  // render
  return (
    <td>
      <Button
        style={{width: "6em"}}
        variant={isActive ? 'outline-success' : 'outline-secondary'}
        type='button'
        onClick={() => handleSelect()}
      >
        {name}
      </Button>
      <Form.Check
        type='checkbox'
        style={{'display': 'none'}}
        checked={isActive}
        onChange={() => {
        }}
      />
    </td>
  )

}


const monthName = (month: number) =>
  moment(new Date(2000, month, 1, 0, 0, 0, 0.0)).format('MMM');

export default function MonthSelect({value, onChange}: { value: boolean[], onChange: (months: boolean[]) => void }) {
  // states
  const [months, setMonths] = useState(value);
  // callbacks
  const handleSelect = useCallback((month: number, state: boolean) => {
    let m = [...months];
    m[month] = state;
    setMonths(m);
    onChange(m);
  }, [months, onChange]);
  // effects
  useEffect(() => {
    setMonths([...value]);
  }, [value])
  // render
  return (
    <table>
      <tbody>
      {
        [0, 1, 2, 3].map(i => (
          <tr key={i}>
            {[0, 1, 2].map(j => {
              let m = i * 3 + j;
              return (
                <MonthButton
                  key={j}
                  active={months[m]}
                  name={monthName(m)}
                  onSelect={(s) => handleSelect(m, s)}
                />
              )
            })}
          </tr>
        ))
      }
      </tbody>
    </table>
  );

}
