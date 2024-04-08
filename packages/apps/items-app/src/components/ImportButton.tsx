import {useCallback, useState} from "react";
import {Button} from "react-bootstrap";
import {BsBoxArrowUp} from "react-icons/bs";

export default function ImportButton({onImport}: { onImport: (objects: any[]) => Promise<void> }) {
  // states
  const [pending, setPending] = useState(false);
  // callbacks
  const handleImport = useCallback(() => {
    // read text from clipboard
    navigator.clipboard.readText()
      .then(t => JSON.parse(t))
      .then((o: any) => {
        if (window.confirm(`Do you really want to import ${o.length} elements?`)) {
          setPending(true);
          onImport(o)
            .then(() => {
            })
            .catch(e => {
              console.error(e);
              alert('Something went wrong');
            })
            .then(() => setPending(false));
        }
      })
      .catch(e => {
        window.alert('Import failed');
        e && console.error(e)
      });
  }, [onImport])
  // render button
  return <Button onClick={handleImport} variant='primary' disabled={pending}><BsBoxArrowUp/>&nbsp;Import</Button>
}

