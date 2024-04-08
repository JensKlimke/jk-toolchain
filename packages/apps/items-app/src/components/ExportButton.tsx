import {useCallback, useState} from "react";
import {Button} from "react-bootstrap";
import {BsBoxArrowDown} from "react-icons/bs";

export default function ExportButton({object}: { object: any }) {
  // states
  const [copied, setCopied] = useState(false);
  // callback, when button is clicked. Changes when object changes
  const handleExport = useCallback(() => {
    // copy text
    navigator.clipboard
      .writeText(JSON.stringify(object))
      .then(() => setCopied(true))
      .then(() => window.setTimeout(() => setCopied(false), 2000))
      .catch(e => console.error(e));
  }, [object]);
  // return the button
  return <Button onClick={handleExport}><BsBoxArrowDown/> {copied ? 'copied' : 'Export'}</Button>

}
