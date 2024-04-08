import 'bootswatch/dist/slate/bootstrap.min.css'
import "@sdk/layout/assets/index.scss"
import ReactDOM from 'react-dom/client'
import {Auth, AuthProvider} from "@sdk/dashboard";
import {Container} from 'react-bootstrap';
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <AuthProvider>
    <Auth>
      <Container>
        <App />
      </Container>
    </Auth>
  </AuthProvider>
);
