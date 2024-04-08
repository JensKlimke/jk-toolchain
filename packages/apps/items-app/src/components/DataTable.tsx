import {Button, Card, Dropdown, Form, InputGroup, Pagination, Table} from 'react-bootstrap';
import {DataComponentConfigType, DataSortConfig, EntryWithId, OnRowClickType} from "../hooks/entry";
import React, {useEffect, useReducer} from "react";
import {BsArrowDown, BsArrowUp, BsDot, BsPlusCircle, BsSortAlphaDown, BsXLg} from "react-icons/bs";

const NUMBER_ELEMENTS_PER_PAGE = 25;


type StateType = {
  sort: {
    field: number
    asc: boolean
  } | undefined;
  page: number
  totalPages: number
  display: EntryWithId[]
  totalDisplay: number
  results: EntryWithId[]
  totalResults: number
  sortConfig: DataSortConfig | undefined
  filter: string
}

const stateDefault: StateType = {
  sort: undefined,
  page: 0,
  totalPages: 0,
  display: [],
  results: [],
  totalDisplay: 0,
  totalResults: 0,
  sortConfig: undefined,
  filter: '',
}

type ActionType = {
  action: string,
  payload: any
};

function dataReducer(data: StateType, p: ActionType): StateType {
  const state = {...data};
  switch (p.action) {
    case 'SET_RESULTS':
      state.results = [...p.payload];
      break;
    case 'SET_PAGE':
      // set page
      state.page = p.payload;
      break;
    case 'SET_SORT_CONFIG':
      state.sortConfig = {...(p.payload as DataSortConfig)};
      state.sort = state.sortConfig?.default;
      break;
    case 'SORT':
      // save sort
      if (!state.sort)
        state.sort = {field: p.payload, asc: true};
      else if (state.sort.field === p.payload && state.sort.asc)
        state.sort = {field: state.sort.field, asc: false};
      else if (state.sort.field === p.payload && !state.sort.asc)
        state.sort = undefined;
      else
        state.sort = {field: p.payload, asc: true};
      break;
    case 'SET_FILTER':
      state.page = 0;
      state.filter = (p.payload as string);
      break;
  }
  // sort data
  state.display = [...state.results];
  if (state.sort && state.sortConfig) {
    const sort = state.sortConfig.fields[state.sort.field].callback;
    state.display.sort((a, b) => state?.sort?.asc ? sort(a, b) : sort(b, a));
  }
  // filter data
  state.display = state.display.filter(d => {
    return state.sortConfig?.filterText(d).toLowerCase().includes(state.filter.toLowerCase())
  });
  // calculate slice indexes
  const from = state.page * NUMBER_ELEMENTS_PER_PAGE;
  const to = (state.page + 1) * NUMBER_ELEMENTS_PER_PAGE;
  // set counts
  state.totalPages = Math.ceil(state.display.length / NUMBER_ELEMENTS_PER_PAGE);
  state.totalDisplay = state.display.length;
  state.totalResults = state.results.length;
  // calc page
  if (state.totalPages <= 1)
    state.page = 0;
  else if (state.totalPages - 1 < state.page)
    state.page = state.totalPages - 1;
  // apply page slice
  state.display = state.display.slice(from, to);
  // return state
  return state;
}

export type DataTableProps = {
  tableConfig?: DataComponentConfigType
  cardConfig?: DataComponentConfigType
  sortConfig?: DataSortConfig
  data: EntryWithId[]
  onRowClick: OnRowClickType
  onAdd?: () => void
}

export default function DataTable({tableConfig, cardConfig, sortConfig, data, onRowClick, onAdd}: DataTableProps) {
  // states
  const [state, dispatch] = useReducer(dataReducer, stateDefault);
  // effects
  useEffect(() => {
    dispatch({action: 'SET_SORT_CONFIG', payload: sortConfig});
  }, [sortConfig]);
  useEffect(() => {
    dispatch({action: 'SET_RESULTS', payload: data});
  }, [data]);
  // render table
  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        {onAdd ?
          <Button onClick={onAdd}><BsPlusCircle/></Button> :
          <span>&nbsp;</span>
        }
        {
          (state.results.length === 0) && <p className='text-center text-muted mt-3'>Nothing to be shown!</p>
        }
        {
          (state.totalDisplay > 0 && state.totalPages > 1) && (
            <Pagination className='mb-0'>
              {
                Array(state.totalPages).fill(0).map((_, p) => (
                  <Pagination.Item key={p} active={p === state.page}
                                   onClick={() => dispatch({action: 'SET_PAGE', payload: p})}>
                    {p + 1}
                  </Pagination.Item>
                ))
              }
            </Pagination>
          )
        }
        {(sortConfig && state.results.length > 0) ?
          <Dropdown>
            <Dropdown.Toggle>
              <BsSortAlphaDown/>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {
                sortConfig.fields.map((c : any, i : number) => (
                  <Dropdown.Item key={i} onClick={() => dispatch({action: 'SORT', payload: i})}>
                    {state.sort && state.sort.field === i ? (state.sort.asc ? <BsArrowDown/> : <BsArrowUp/>) :
                      <BsDot/>}&nbsp;{c.label}
                  </Dropdown.Item>
                ))
              }
            </Dropdown.Menu>
          </Dropdown> :
          <span>&nbsp;</span>
        }
      </div>
      {
        (state.results.length > 0) && (
          <div>
            <Form>
              <InputGroup className="mt-3">
                <Form.Control
                  type='text'
                  placeholder='Type to filter...'
                  value={state.filter}
                  onChange={(e) => dispatch({action: 'SET_FILTER', payload: e.target.value})}
                />
                <Button variant='outline-light' onClick={() => dispatch({action: 'SET_FILTER', payload: ''})}>
                  <BsXLg/>
                </Button>
              </InputGroup>
            </Form>
          </div>
        )
      }
      {(state.totalDisplay > 0) && (
        <>
          <div className='overflow-auto mt-3'>
            <div className='d-none d-md-block'>
              {tableConfig &&
                  <TableComponent
                      config={tableConfig}
                      state={state}
                      updateSort={(i) => dispatch({action: 'SORT', payload: i})}
                      onRowClick={onRowClick}
                  />
              }
            </div>
            <div className='d-block d-md-none'>
              {cardConfig &&
                  <CardsComponent
                      config={cardConfig}
                      state={state}
                      updateSort={(i) => dispatch({action: 'SORT', payload: i})}
                      onRowClick={onRowClick}
                  />
              }
            </div>
          </div>
          <p className='text-center text-muted'>
            {`page ${state.page + 1} of ${state.totalPages} - ${state.totalDisplay} results (${state.totalResults} in total)`}
          </p>
        </>
      )}
      {(state.totalDisplay === 0 && state.results.length > 0) && (
        <p className='text-center mt-4'>Change filter to show results.</p>
      )}
    </>
  )
}

interface DataComponentProps {
  config: DataComponentConfigType
  sortConfig?: DataSortConfig
  state: StateType
  updateSort: (i: number) => void
  onRowClick: OnRowClickType
}

function TableComponent({config, state, updateSort, onRowClick}: DataComponentProps) {
  return (
    <Table striped bordered hover style={{width: '100%'}}>
      <thead>
      <tr>
        {config.cols.map((c : any, i : number) => {
          // create props
          const props = {
            style: c.width ? {width: `${c.width}%`} : undefined,
            key: i,
            className: 'text-center text-nowrap user-select-none',
            scope: 'col',
          };
          // switch
          if (c.sort !== undefined) {
            return (
              <th
                {...props}
                onClick={() => updateSort(c.sort || 0)}
                role='button'
              >
                {c.label}&nbsp;{state.sort && state.sort.field === c.sort ? (state.sort.asc ? <BsArrowDown/> :
                <BsArrowUp/>) : <BsDot/>}
              </th>
            );
          } else {
            return (
              <th {...props}>
                {c.label}
              </th>
            );
          }
        })}
      </tr>
      </thead>
      <tbody>
      {
        state.display.map((d, i) => (
          <tr key={i} onClick={() => onRowClick(d, state.results, i, state.page, state.totalPages)} role='button'>
            {config.cols.map((c : any, j : number) => (
              <td key={j} className={c.className || ''}>
                {c.content(d, state.results, i, state.page, state.totalPages)}
              </td>
            ))}
          </tr>
        ))
      }
      </tbody>
    </Table>
  )
}

function CardsComponent({config, state, onRowClick}: DataComponentProps) {
  return (
    <>
      {
        state.display.map((d, i) => (
          <Card key={i} onClick={() => onRowClick(d, state.results, i, state.page, state.totalPages)} role='button'
                className='mb-3'>
            {config.title && <Card.Header>{config.title(d, state.results, i)}</Card.Header>}
            <Table borderless striped className='m-0'>
              <tbody>
              {config.cols.map((c : any, j : number) => (
                <tr key={j}>
                  <td key={i} width='50%'>{c.label}</td>
                  <td className={c.className || ''}>{c.content(d, state.results, i, state.page, state.totalPages)}</td>
                </tr>
              ))}
              </tbody>
            </Table>
            {config.footer &&
                <Card.Footer>{config.footer(d, state.results, i, state.page, state.totalPages)}</Card.Footer>}
          </Card>
        ))
      }
    </>
  )
}
