import React from 'react';
import { Table } from 'semantic-ui-react';

export default function CustomTable({ columns, rows }) {
  return (
    <>
      <Table celled>
        <Table.Header>
          <Table.Row>
            {columns.map((col, ind) => (
              <Table.HeaderCell>{col.hostName}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {rows.map((row, ind) => (
            <Table.Row>
              {row.map((item) => (
                <Table.Cell>{item.rwrText}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}
