import 'bootswatch/dist/slate/bootstrap.min.css'
import React from 'react';
import ReactDOM from 'react-dom/client'
import InformationTable from "./InformationTable";
import {Auth, AuthProvider} from "@sdk/dashboard";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <AuthProvider>
    <Auth>
      <InformationTable />
    </Auth>
  </AuthProvider>
);
