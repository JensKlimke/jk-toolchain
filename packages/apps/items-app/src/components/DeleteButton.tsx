import {Button} from "react-bootstrap";
import {useCallback, useState} from "react";

export default function DeleteButton({onDelete}: { onDelete: () => Promise<void> }) {
  // states
  const [pending, setPending] = useState(false);
  // callbacks
  const handleDelete = useCallback(() => {
    // set pending
    setPending(true);
    // execute delete
    onDelete()
      .then(() => setPending(false));
  }, [onDelete]);
  // button
  return (
    <Button variant='danger' onClick={handleDelete} disabled={pending}>Delete all</Button>
  )
}
