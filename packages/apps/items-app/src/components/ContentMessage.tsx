import {Col, Container, Row, Spinner} from "react-bootstrap";

export default function ContentMessage({text}: { text: string | JSX.Element }) {
  return (
    <Container>
      <Row className='justify-content-md-center'>
        <Col className='text-center'>
          <Spinner animation='grow' size='sm' className='me-3'/>{text}&hellip;
        </Col>
      </Row>
    </Container>
  )
}
