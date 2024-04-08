import React, {useMemo} from "react";
import {ButtonGroup, Card, Col, Container, Row} from "react-bootstrap";
import {ContractCols, ContractRows, ContractSort} from "./Contracts.table";
import ContractProvider, {ContractContext, ContractType, useContracts} from "./Contracts.context";
import ContentMessage from "../../components/ContentMessage";
import EntryFormModal from "../../components/EntryFormModal";
import {MetricsTable} from "./components/MetricsTable";
import {MonthsTable} from "./components/MonthsTable";
import DataTable from "../../components/DataTable";
import ImportButton from "../../components/ImportButton";
import ExportButton from "../../components/ExportButton";
import DeleteButton from "../../components/DeleteButton";
import ContractsForm from "./Contracts.form";

export default function ContractsPage() {
  // render
  return (
    <ContractProvider>
      <ContractContent/>
    </ContractProvider>
  );
}

const ContractContent = () => {
  // get data
  const {data: contractsData, edit, saveMany, eraseAll} = useContracts();
  // calculate statistics
  const statisticsData = useMemo(() => {
    return contractsData && statistics(contractsData);
  }, [contractsData]);
  // check data
  if (!statisticsData || !contractsData)
    return <ContentMessage text={'Loading contracts'}/>;
  // render
  return (
    <Container>
      <Row>
        <Col lg={8} className='mb-4'>
          <Card>
            <Card.Header>Contracts</Card.Header>
            <Card.Body>
              <DataTable
                tableConfig={ContractCols}
                cardConfig={ContractRows}
                sortConfig={ContractSort}
                data={contractsData}
                onRowClick={(d : any) => edit(d._id)}
                onAdd={() => edit('')}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          {contractsData.length > 0 && (
            <>
              <Card className='mb-4'>
                <Card.Header>Per Month</Card.Header>
                <Card.Body>
                  <MonthsTable data={statisticsData}/>
                </Card.Body>
              </Card>
              <Card className='mb-4'>
                <Card.Header>Metrics</Card.Header>
                <Card.Body>
                  <MetricsTable data={statisticsData}/>
                </Card.Body>
              </Card>
            </>
          )}
          <Card>
            <Card.Header>Data Management</Card.Header>
            <Card.Body>
              <ButtonGroup vertical className='d-flex'>
                <ImportButton onImport={saveMany}/>
                <ExportButton object={contractsData}/>
                <DeleteButton onDelete={eraseAll}/>
              </ButtonGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <EntryFormModal context={ContractContext} name='contract'>
        {(entry, update, handleSubmit) =>
          <ContractsForm entry={entry} update={update} handleSubmit={handleSubmit}/>
        }
      </EntryFormModal>
    </Container>
  );
}


const statistics = (contracts: ContractType[]) => {
  // get months array
  const months = Array.from(Array(12).keys());
  // calculate value
  const perMonth = months.map((m) => contracts.reduce((s, c) => s + (c.months[m] ? c.amount : 0.0), 0.0));
  const sumOfYear = perMonth.reduce((s, c) => s + c, 0.0);
  const monthlyAverage = sumOfYear / 12;
  const maxMonth = perMonth.reduce((j, m, i, a) => (m > a[j] ? i : j), 0);
  const sharedAmount = contracts.reduce((s, c) => s + (c.shared ? (c.amount * c.months.filter(x => x).length) / 12 : 0.0), 0);
  // send result
  return {sumOfYear, perMonth, monthlyAverage, maxMonth, sharedAmount};
}

