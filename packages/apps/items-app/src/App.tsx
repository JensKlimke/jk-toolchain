import {Row, Col, Card, Button} from 'react-bootstrap';
import {useAuth} from "@sdk/dashboard";
import ContractsPage from "./pages/contracts/Contracts.page";

export default function App () {
	// auth callbacks
	const {logout} = useAuth();
	// render
	return (
		<Row className='mt-3'>
			<Button onClick={() => logout()}>Logout</Button>
		<Row className='mt-3'>
		</Row>
			<Col lg={12}>
				<ContractsPage />
			</Col>
		</Row>
	)    
}