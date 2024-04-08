import {evaluate} from "mathjs";
import {ChangeEvent, useCallback, useState} from "react";
import {Form, InputGroup} from "react-bootstrap";

export default function AmountInput({value, onChange, autoFocus}: {
  value: number,
  onChange: (value: number) => void,
  autoFocus?: boolean
}) {
  // states
  const [stringValue, setStringValue] = useState<string>(value.toString());
  const [error, setError] = useState(false);
  // react on val
  const changeValue = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    // set pure value
    const value = event.target.value;
    setStringValue(value);
    // try to evaluate value
    try {
      // try to evaluate
      const v = value.trim() === '' ? 0 : Math.round(evaluate(value).toFixed(2) * 100) / 100;
      onChange(v);
    } catch (e) {
      // on error return
      setError(true);
      return;
    }
    // no error
    setError(false);
  }, [onChange])
  // render
  return (
    <InputGroup className="mb-3">
      <InputGroup.Text>€</InputGroup.Text>
      <Form.Control
        autoFocus={autoFocus !== undefined ? autoFocus : undefined}
        onChange={changeValue}
        value={stringValue}
        placeholder="49.99"
        isInvalid={error}
      />
      <InputGroup.Text>{value}</InputGroup.Text>
    </InputGroup>
  )

}
