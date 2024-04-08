import {ContractType} from "./Contracts.context";
import {FormEvent} from "react";
import {Form} from "react-bootstrap";
import AmountInput from "../../components/AmountInput";
import MonthSelect from "../../components/MonthSelect";
import {UpdateCallbackType} from "../../hooks/entry";

export default function ContractsForm({entry, handleSubmit, update}: {
  entry: ContractType,
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void,
  update: UpdateCallbackType<ContractType>
}) {
  return (
    <Form onSubmit={(e) => handleSubmit(e)} id='entryForm' method='post'>
      <Form.Group className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          autoFocus
          value={entry.name}
          onChange={(e) => update('name', e.target.value)}
          type="text"
          placeholder="My Contract"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Creditor</Form.Label>
        <Form.Control
          value={entry.creditor}
          onChange={(e) => update('creditor', e.target.value)}
          type="text"
          placeholder="The Creditor Inc."
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Amount</Form.Label>
        <AmountInput
          value={entry.amount}
          onChange={(v: number) => update('amount', v)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Months</Form.Label>
        <MonthSelect
          value={entry.months}
          onChange={(months: boolean[]) => update('months', months)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Check
          checked={entry.shared}
          onChange={(e) => update('shared', e.target.checked)}
          type="switch"
          label="Shared"
        />
        <Form.Text className="text-muted">
          If your contract is shared with somebody, check this button.
        </Form.Text>
      </Form.Group>
    </Form>
  )
}

