import React from "react";
import {Button, Card, Col, Container, Image, Row, Table} from "react-bootstrap";
import {useApiData, useAuth} from "@sdk/dashboard";

export const WHO_IS_API_URL = process.env.REACT_APP_WHO_IS_API_URL || 'http://localhost:3004';

export default function InformationTable () {
  // get data
  const {session, logout} = useAuth();
  const whoIdData = useApiData<{id: string} | undefined>(WHO_IS_API_URL);
  // render
  return (
    <Container>
      <Row className='justify-content-center mt-4'>
        <Col lg={8} xl={6}>
          <Card>
            <Card.Header>User Information</Card.Header>
            <Card.Body>
              {
                session?.user.avatar && (
                  <div className='text-center mb-1'>
                    <Image className='rounded-circle border-2' style={{width: '96px'}} src={session?.user.avatar}/>
                  </div>
                )
              }
              <div className='text-center mb-4'>
                {session?.user.name}
              </div>
              <Table hover style={{width: "100%", tableLayout: "fixed", overflowWrap: "break-word"}}>
                <tbody>
                <tr>
                  <td>Email</td>
                  <td>{session?.user.email}</td>
                </tr>
                <tr>
                  <td>Role</td>
                  <td>{session?.user.role}</td>
                </tr>
                <tr>
                  <td>User ID</td>
                  <td>
                    <code>{session?.user.id}</code>
                  </td>
                </tr>
                <tr>
                  <td>Token</td>
                  <td className='position-relative' role='button'
                      onClick={() => navigator.clipboard.writeText(session?.token || '')}>
                    <code>{session?.token || 'n/a'}</code>
                  </td>
                </tr>
                <tr>
                  <td>API ID</td>
                  <td>
                    <code>{whoIdData?.id || 'n/a'}</code>
                  </td>
                </tr>
                </tbody>
              </Table>
              <div className='text-center'>
                <Button onClick={logout}>Logout</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}