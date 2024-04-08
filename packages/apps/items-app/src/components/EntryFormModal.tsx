import React, {FormEvent, useCallback, useContext, useEffect, useState} from "react";
import {Alert, Button, Modal, Spinner} from "react-bootstrap";
import {UpdateCallbackType} from "../hooks/entry";

export default function EntryFormModal({children, context, name}: {
                                         children: (entry: any, update: UpdateCallbackType<any>, handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void) => JSX.Element,
                                         context: React.Context<any>,
                                         name: string
                                       }
) {
  // states
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  // context
  const {entry, save, erase, edit, update} = useContext(context);
  // callbacks
  const handleClone = useCallback(() => {
    (entry !== undefined) && edit('', entry);
  }, [entry, edit]);
  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    // stop
    e.preventDefault();
    // save
    save()
      .then(() => {
      })
      .catch((e: Error) => setError(e.message))
      .then(() => setPending(false));
  }, [save]);
  useEffect(() => {
    // unset error
    setError(undefined);
  }, [entry]);
  // check
  if (!entry) return null;
  // render
  return (
    <Modal show={true} onHide={() => edit(undefined)}>
      <Modal.Header closeButton>
        <Modal.Title>{entry._id === undefined ? 'Create new' : 'Edit'} {name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {children(entry, update, handleSubmit)}
        {error && <Alert variant="danger" onClose={() => setError(undefined)} dismissible>{error}</Alert>}
      </Modal.Body>
      <Modal.Footer className='justify-content-between'>
        <span>
          {entry._id !== undefined &&
              <Button className='btn-block ml-1' variant="outline-danger" onClick={erase}>Delete</Button>}
          {entry._id === undefined &&
              <span>{name} not saved</span>}
          {entry._id !== undefined &&
              <Button className='btn-block ms-2' variant="outline-info" onClick={handleClone}>Clone</Button>}
        </span>
        <span>
          <Button variant="outline-primary" onClick={() => edit(undefined)}>Abort</Button>
          <Button variant="success" type="submit" form='entryForm' className='ms-2' disabled={pending}>
            {!pending ? <span>Save</span> : <Spinner animation='border' size='sm'/>}
          </Button>
        </span>
      </Modal.Footer>
    </Modal>
  );
}
