import moment from "moment";
import {ContractType} from "./Contracts.context";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {BsPeople, BsPeopleFill} from "react-icons/bs";
import MonthCircle from "../../components/MonthCircle";
import CurrencyCell from "../../components/CurrencyCell";
import {DataComponentConfigType, DataSortConfig} from "../../hooks/entry";
import React from "react";

const annual = (contract: ContractType) =>
  contract.months.reduce((sum, v) => (sum + (v ? contract.amount : 0.0)), 0.0);

const nextDue = (contract: ContractType) => {
  // get next month
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  // find next month
  const m = contract.months.indexOf(true, month + 1);
  // next due month and year
  return new Date(year + (m > -1 ? 0 : 1), m > -1 ? m : contract.months.indexOf(true), 1,
    0, 0, 0, 0);
}

const dateSort = (a: ContractType, b: ContractType) => {
  // calculate next
  const dateA = nextDue(a);
  const dateB = nextDue(b);
  // calculate days
  return dateA.getTime() - dateB.getTime();
}

export const ContractCols: DataComponentConfigType = {
  cols: [
    {
      label: 'Description',
      content: (row: ContractType) => (
        <>
          <span>{(row.shared ? <><BsPeopleFill/>&nbsp;</> : '')}{row.name}</span><br/>
          <i className='text-muted'>{row.creditor}</i>
        </>
      ),
      className: 'align-middle',
      width: 50,
      sort: 0
    },
    {
      label: 'Contract Amount',
      content: (row: ContractType) => <CurrencyCell amount={row.amount}/>,
      className: 'align-middle text-end',
      width: 20,
      sort: 2
    },
    {
      label: 'Annual Amount',
      content: (row: ContractType) => <CurrencyCell amount={annual(row)}/>,
      className: 'align-middle text-end',
      width: 20,
      sort: 3
    },
    {
      label: 'Next',
      content: (row: ContractType) => {
        // calculate date
        const date = nextDue(row);
        // tooltip
        const tooltip = (props: any) => (
          <Tooltip {...props}>
            {`${moment(date).fromNow()} (${moment(date).format('MMMM YYYY')})`}
          </Tooltip>
        );
        // render
        return (
          <OverlayTrigger placement='left' delay={{show: 250, hide: 400}} overlay={tooltip}>
          <span>
            <MonthCircle months={row.months} next={date.getMonth()}/>
          </span>
          </OverlayTrigger>
        );
      },
      className: 'align-middle text-center',
      width: 10,
      sort: 4
    },
  ]
};


export const ContractRows: DataComponentConfigType = {
  title: (row: ContractType) => <>{(row.shared ? <><BsPeople/>&nbsp;&nbsp;</> : '')}{row.name}</>,
  cols: [
    {
      label: 'Creditor',
      content: (row: ContractType) => row.creditor,
      className: 'text-end',
    },
    {
      label: 'Contract Amount',
      content: (row: ContractType) => <CurrencyCell amount={row.amount}/>,
      className: 'text-end',
    },
    {
      label: 'Annual Amount',
      content: (row: ContractType) => <CurrencyCell amount={annual(row)}/>,
      className: 'text-end',
    },
    {
      label: 'Next due month',
      content: (row: ContractType) => {
        const date = nextDue(row);
        return `${moment(date).format('MMMM YYYY')}`;
      },
      className: 'text-end',
    },
  ]
};

export const ContractSort: DataSortConfig = {
  fields:
    [
      {
        label: 'Name',
        callback: (a: ContractType, b: ContractType) => a.name.localeCompare(b.name),
      },
      {
        label: 'Creditor',
        callback: (a: ContractType, b: ContractType) => a.creditor.localeCompare(b.creditor),
      },
      {
        label: 'Amount',
        callback: (a: ContractType, b: ContractType) => (a.amount - b.amount),
      },
      {
        label: 'Annual Amount',
        callback: (a: ContractType, b: ContractType) => (annual(a) - annual(b)),
      },
      {
        label: 'Due Date',
        callback: dateSort,
      },
      {
        label: 'Shared',
        callback: (a: ContractType, b: ContractType) => ((a.shared ? 1.0 : 0.0) - (b.shared ? 1.0 : 0.0)),
      },
    ],
  filterText: (a: ContractType) => {
    const next = ` ${moment(nextDue(a)).format('MMMM YYYY')}`;
    return `${a.name} ${a.creditor} ${a.amount} ${annual(a)}${next}`;
  }
}
