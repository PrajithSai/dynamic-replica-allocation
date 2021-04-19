import React, { useState } from 'react';
import { Header, Button, Table } from 'semantic-ui-react';
import Select from 'react-select';
import {
  cloneDeep,
  filter,
  findIndex,
  groupBy,
  sortBy,
  startCase,
  intersectionWith,
} from 'lodash';
import Graph from 'react-graph-vis';

import ReactDataGrid from 'react-data-grid';

import 'semantic-ui-css/semantic.min.css';
import './App.scss';

const TIMER = 3000;

const MH_LENGTH = 6;

function App() {
  const [spaceAvailable, setSpaceAvailable] = useState({
    label: '',
    value: '',
  });
  const [numberOfDataItems, setNumberOfDataItems] = useState({
    label: '',
    value: '',
  });
  const [reads, setReads] = useState([]);
  const [writes, setWrites] = useState({});
  const [esaf, setEsaf] = useState({ indexes: [] });
  const [edafn, setEDAFN] = useState([]);
  const [rwrByGroup, setRWRByGroup] = useState([[], []]);
  const graph = {
    nodes: [
      { id: 1, label: 'M1', title: 'M1' },
      { id: 2, label: 'M2', title: 'M2' },
      { id: 3, label: 'M3', title: 'M3' },
      { id: 4, label: 'M4', title: 'M4' },
      { id: 5, label: 'M5', title: 'M5' },
      { id: 6, label: 'M6', title: 'M6' },
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 1 },
      { from: 2, to: 4 },
      { from: 3, to: 1 },
      { from: 3, to: 4 },
      { from: 4, to: 2 },
      { from: 4, to: 3 },
      { from: 4, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 4 },
      { from: 5, to: 6 },
      { from: 6, to: 4 },
      { from: 6, to: 5 },
    ],
  };

  const events = {
    select: function (event) {
      var { nodes, edges } = event;
      // console.log({ nodes, edges });
    },
  };

  const options = {
    layout: {
      hierarchical: false,
    },
    edges: {
      color: '#000000',
      arrows: { to: { enabled: false } },
    },
    height: '330px',
    width: '330px',
  };

  const getAllSpaceAvailableOptions = (startAt = 2) => {
    const options = [];
    for (let i = startAt; i <= 20; i += 1) {
      options.push({ label: i, value: i });
    }
    return options;
  };

  function getRandomArbitrary(min = 0.1, max = 1) {
    return Math.random() * (max - min) + min;
  }

  const getWritesByDataItems = () => {
    const dataItems = {};
    for (let i = 1; i <= numberOfDataItems.value; i += 1) {
      const dataItem = `D${i}`;
      const writeProbability = getRandomArbitrary().toFixed(2);
      dataItems[dataItem] = Number(writeProbability);
    }
    // console.log('out', dataItems);
    return dataItems;
  };

  const getReadsByDataItems = () => {
    const readsByItems = [];
    for (let i = 1; i <= MH_LENGTH; i += 1) {
      const host = {
        id: i,
        hostName: `M${i}`,
      };
      for (let j = 1; j <= numberOfDataItems.value; j += 1) {
        const dataItemName = `D${j}`;
        host[dataItemName] = Number(getRandomArbitrary().toFixed(2));
      }
      readsByItems.push(host);
    }
    return readsByItems;
  };

  const startReplication = () => {
    const readsByDataItems = getReadsByDataItems();
    const writesByDataItems = getWritesByDataItems();
    setReads(readsByDataItems);
    setWrites(writesByDataItems);
  };

  const relocationPeriod = () => {
    const writesByDataItems = getWritesByDataItems();
    setWrites(writesByDataItems);
  };

  const resetState = () => {
    setSpaceAvailable({
      label: '',
      value: '',
    });
    setNumberOfDataItems({
      label: '',
      value: '',
    });
  };

  const getReadsColumns = () => {
    return reads.length > 0
      ? Object.keys(reads[0])
          .filter((val) => val !== 'id')
          .map((val) => ({
            key: val,
            name: startCase(val),
            resizable: true,
            // width: 100,
          }))
      : [];
  };

  const getRWRFromReadAndWrite = () => {
    const readsClone = cloneDeep(reads);
    if (readsClone.length) {
      for (let i = 0; i < MH_LENGTH; i += 1) {
        for (let j = 1; j <= numberOfDataItems.value; j += 1) {
          const dataItemName = `D${j}`;
          const readProbabilityByDataItem = readsClone[i][dataItemName];
          const writeProbabilityByDataItem = writes[dataItemName];
          readsClone[i][dataItemName] = Number(
            (readProbabilityByDataItem / writeProbabilityByDataItem).toFixed(2)
          );
        }
      }
    }
    return readsClone;
  };

  const getOrderedRWR = (rwr) => {
    return rwr.map((row) => {
      const updatedRow = { id: row.id, hostName: row.hostName, dataItems: [] };
      const ownDataItemName = `D${row.id}`;
      const temp = Object.keys(row)
        .filter((key) => key.startsWith('D') && key !== ownDataItemName)
        .map((key) => ({ name: key, value: row[key] }));
      // console.log({ unsorted: temp, sorted: sortBy(temp, ['value']) });
      sortBy(temp, ['value'])
        .reverse()
        .map((item, ind) => {
          if (ind === 0) {
            updatedRow[ownDataItemName] = row[ownDataItemName];
            updatedRow.dataItems.push(
              `${ownDataItemName} = ${row[ownDataItemName]}`
            );
          }
          updatedRow[item.name] = item.value;
          updatedRow.dataItems.push(`${item.name} = ${item.value}`);
          return item;
        });
      return updatedRow;
    });
  };

  const readsColumns = getReadsColumns();
  const rwr = getRWRFromReadAndWrite();
  const rwrOrdered = getOrderedRWR(rwr);
  // console.log({ rwrOrdered });
  const showESAF = () => {
    const indexes = [];
    for (let i = 0; i < spaceAvailable.value; i += 1) {
      indexes.push(i);
    }
    setEsaf({ indexes });
  };

  const showEDAFN = () => {
    const rows = {};
    const spaceAvail = spaceAvailable.value;
    const intersections = [];
    const rwrDataItems = rwrOrdered.map((rwr) => ({
      ...rwr,
      dataItems: rwr.dataItems.map((item) => {
        const newItem = {};
        const split = item.split('=');
        newItem.name = split[0].trim();
        newItem.id = newItem.name.split('')[1];
        newItem.value = Number(split[1].trim());
        return newItem;
      }),
    }));
    for (let i = 0; i < rwrDataItems.length; i += 1) {
      const currentNode = rwrDataItems[i];
      const connectedNodes = filter(graph.edges, { from: i + 1 }).map(
        (edge) => `M${edge.to}`
      );
      if (!rows[currentNode.hostName]) rows[currentNode.hostName] = {};
      rows[currentNode.hostName]['connectedNodes'] = connectedNodes;
      const currentNodeDataItems = currentNode.dataItems.slice(1, spaceAvail);
      for (let j = 0; j < connectedNodes.length; j += 1) {
        const connectedNodeName = connectedNodes[j];
        const cnIndex = findIndex(rwrDataItems, {
          hostName: connectedNodeName,
        });
        const connectedNode = rwrDataItems[cnIndex];
        const currentCNDataItems = connectedNode.dataItems.slice(1, spaceAvail);
        const intersection = intersectionWith(
          currentNodeDataItems,
          currentCNDataItems,
          (arrVal, othVal) => arrVal.name === othVal.name
        );
        if (intersection.length) {
          intersections.push({
            owner: currentNode.hostName,
            duplicate: connectedNodeName,
            intersection,
          });
        }
      }
    }
    // console.log({ intersections });
    replaceDuplicates(intersections, rwrDataItems, rows);
  };

  const replaceDuplicates = (intersections, rwrDataItems, connections) => {
    for (let i = 0; i < intersections.length; i += 1) {
      const row = intersections[i];
      for (let j = 0; j < row.intersection.length; j += 1) {
        const ownerIndex = findIndex(rwrDataItems, { hostName: row.owner });
        const duplicateIndex = findIndex(rwrDataItems, {
          hostName: row.duplicate,
        });
        const ownerRow = rwrDataItems[ownerIndex];
        const duplicateRow = rwrDataItems[duplicateIndex];
        const itemName = row.intersection[j].name;
        if (
          ownerRow.id === Number(itemName.split('')[1]) ||
          ownerRow[itemName] > duplicateRow[itemName]
        ) {
          let itemIndex = findIndex(duplicateRow.dataItems, {
            name: itemName,
          });
          duplicateRow.dataItems.splice(itemIndex, 1);
          // console.log(duplicateRow.dataItems[itemIndex], itemIndex);
          // while (
          //   duplicateRow.dataItems[itemIndex] &&
          //   itemIndex < duplicateRow.dataItems.length &&
          //   connections[duplicateRow.hostName].connectedNodes.includes(
          //     `M${duplicateRow.dataItems[itemIndex].name.split('')[1]}`
          //   )
          // ) {
          //   duplicateRow.dataItems.splice(itemIndex, 1);
          //   itemIndex += 1;
          // }
          rwrDataItems[duplicateIndex] = duplicateRow;
        } else if (
          duplicateRow.id === Number(itemName.split('')[1]) ||
          ownerRow[itemName] < duplicateRow[itemName]
        ) {
          let itemIndex = findIndex(ownerRow.dataItems, {
            name: itemName,
          });
          ownerRow.dataItems.splice(itemIndex, 1);
          // while (
          //   ownerRow.dataItems[itemIndex] &&
          //   itemIndex < ownerRow.dataItems.length &&
          //   connections[ownerRow.hostName].connectedNodes.includes(
          //     `M${ownerRow.dataItems[itemIndex].name.split('')[1]}`
          //   )
          // ) {
          //   ownerRow.dataItems.splice(itemIndex, 1);
          //   itemIndex += 1;
          // }
          rwrDataItems[ownerIndex] = ownerRow;
        }
      }
      // console.log({ row, rwrDataItems });
    }
    // console.log({ intersections, rwrDataItems });
    setEDAFN(rwrDataItems);
    checkOwnersCondition(rwrDataItems, connections);
  };

  const checkOwnersCondition = (data, connections) => {
    // console.log(data, connections);
    const rows = [];
    for (let i = 0; i < data.length; i += 1) {
      const row = data[i];
      let endIndex = spaceAvailable.value - 1;
      const currentDataItems = row.dataItems.slice(1, endIndex + 1);
      for (let j = 0; j < currentDataItems.length; j += 1) {
        const di = currentDataItems[j];
        const connectedNodes = connections[row.hostName].connectedNodes.map(
          (ite) => ite.split('')[1]
        );
        if (connectedNodes.includes(di.id)) {
          endIndex += 1;
          if (
            endIndex < row.dataItems.length &&
            connectedNodes.includes(row.dataItems[endIndex]?.id)
          ) {
            endIndex += 1;
          }
          // if (endIndex <= row.dataItems.length - 1) {
          currentDataItems[j] = row.dataItems[endIndex];
          // }
        }
      }
      row.dataItems = [
        row.dataItems[0],
        ...currentDataItems,
        ...row.dataItems.slice(endIndex + 1),
      ];
      rows.push(row);
    }
    // console.log(rows);
    setEDAFN(rows);
  };

  const showEDCG = () => {
    // console.log(edafn);
    const edafn = rwr;
    const data = [[], []];
    for (let i = 1; i <= numberOfDataItems.value; i += 1) {
      const dataItem = `D${i}`;
      const groupName = `G1`;
      const temp = { groupName, name: dataItem, value: 0 };
      if (edafn[0][dataItem]) {
        temp.value += edafn[0][dataItem];
      }
      if (edafn[1][dataItem]) {
        temp.value += edafn[1][dataItem];
      }
      if (edafn[2][dataItem]) {
        temp.value += edafn[2][dataItem];
      }
      if (edafn[3][dataItem]) {
        temp.value += edafn[3][dataItem];
      }
      temp.value = Number(temp.value.toFixed(2));
      data[0].push(temp);
      const temp2 = { groupName: 'G2', name: dataItem, value: 0 };
      if (edafn[4][dataItem]) {
        temp2.value += edafn[4][dataItem];
      }
      if (edafn[5][dataItem]) {
        temp2.value += edafn[3][dataItem];
      }
      temp2.value = Number(temp2.value.toFixed(2));
      data[1].push(temp2);
    }
    // console.log(data);
    setRWRByGroup(data);
  };

  const getFilteredGroup1 = (data) => {
    const newRows = [];
    for (let i = 0; i < data.length; i += 1) {
      const row = data[i];
      if (row.name.split('')[1] > 4) {
        newRows.push(row);
      }
    }
    return newRows;
  };

  const getFilteredGroup2 = (data) => {
    const newRows = [];
    for (let i = 0; i < data.length; i += 1) {
      const row = data[i];
      if (row.name.split('')[1] <= 4) {
        newRows.push(row);
      }
    }
    return newRows;
  };

  const sortedGroup1 = sortBy(rwrByGroup[0], 'value').reverse();
  const sortedGroup2 = sortBy(rwrByGroup[1], 'value').reverse();

  const filteredGroup1 = getFilteredGroup1(sortedGroup1);
  const filteredGroup2 = getFilteredGroup2(sortedGroup2);

  return (
    <div className="App">
      <div
        className="App-div"
        style={{ margin: '15px', padding: '15px', display: 'flex' }}
      >
        <div
          style={{
            width: '20%',
            height: '100vh',
          }}
        >
          <Header as="h3">Dynamic Replica allocation</Header>
          <div className="select-cache">
            <label style={{ fontSize: 16 }}>
              Space available at each node (including originals)
            </label>
            <Select
              value={spaceAvailable}
              onChange={setSpaceAvailable}
              options={getAllSpaceAvailableOptions()}
            />
          </div>
          <div className="select-cache">
            <label style={{ fontSize: 16 }}>Number of data items (D)</label>
            <Select
              value={numberOfDataItems}
              onChange={setNumberOfDataItems}
              options={getAllSpaceAvailableOptions(6)}
            />
          </div>
          <div className="select-cache cache-buttons">
            <Button style={{ width: '50%' }} primary onClick={startReplication}>
              Submit
            </Button>
            <Button
              style={{ width: '50%' }}
              color="teal"
              onClick={relocationPeriod}
            >
              Simulate Relocation Period
            </Button>
          </div>
          <div className="select-cache cache-buttons">
            <Button style={{ width: '60%' }} secondary onClick={showESAF}>
              Show E-SAF+
            </Button>
          </div>
          <div className="select-cache cache-buttons">
            <Button style={{ width: '60%' }} color="violet" onClick={showEDAFN}>
              Show E-DAFN+
            </Button>
          </div>
          <div className="select-cache cache-buttons">
            <Button style={{ width: '60%' }} color="green" onClick={showEDCG}>
              Show E-DCG+
            </Button>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid silver' }}>
          <div style={{ display: 'flex', marginBottom: 15 }}>
            <div style={{ marginLeft: '15px' }}>
              {reads.length > 0 && (
                <>
                  <h3>Reads</h3>
                  <ReactDataGrid
                    columns={readsColumns}
                    rowGetter={(i) => reads[i]}
                    rowsCount={reads.length}
                    rows={reads}
                  />
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {Object.values(writes).length > 0 && (
                <>
                  <h3>Writes</h3>
                  <ReactDataGrid
                    columns={Object.keys(writes).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => reads[i]}
                    rowsCount={1}
                    rows={[writes]}
                  />
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', marginBottom: 15 }}>
            <div style={{ marginLeft: '15px', maxWidth: '45%' }}>
              {rwr.length > 0 && (
                <>
                  <h3>RWR values</h3>
                  <ReactDataGrid
                    columns={readsColumns}
                    rowGetter={(i) => rwr[i]}
                    rowsCount={rwr.length}
                    rows={rwr}
                  />
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {rwrOrdered.length > 0 && (
                <>
                  <h3>Data Items with Ordered RWR</h3>
                  <Table celled padded>
                    {/* <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Host Name</Table.HeaderCell>
                        {getRWRDataItemColumns()}
                      </Table.Row>
                    </Table.Header> */}

                    <Table.Body>
                      {rwrOrdered.map((rwr) => (
                        <Table.Row>
                          <Table.Cell>
                            <strong>{rwr.hostName}</strong>
                          </Table.Cell>
                          {rwr.dataItems.map((item) => (
                            <Table.Cell>{item}</Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', marginBottom: 15 }}>
            <div style={{ marginLeft: '15px' }}>
              {rwrOrdered.length > 0 && (
                <>
                  <h3>E-SAF+</h3>
                  <Table celled padded>
                    <Table.Body>
                      {rwrOrdered.map((rwr) => (
                        <Table.Row>
                          <Table.Cell>
                            <strong>{rwr.hostName}</strong>
                          </Table.Cell>
                          {/* {rwr.dataItems.map((item) => (
                            <Table.Cell>{item}</Table.Cell>
                          ))} */}
                          {esaf?.indexes.map((ind) => (
                            <Table.Cell>{rwr.dataItems[ind]}</Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {rwrOrdered.length > 0 && (
                <div>
                  <Graph
                    graph={graph}
                    options={options}
                    events={events}
                    getNetwork={console.log}
                  />
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', marginBottom: 15 }}>
            <div style={{ marginLeft: '15px' }}>
              {edafn.length > 0 && (
                <>
                  <h3>E-DAFN+</h3>
                  <Table celled padded>
                    <Table.Body>
                      {edafn.map((rwr) => (
                        <Table.Row>
                          <Table.Cell>
                            <strong>{rwr.hostName}</strong>
                          </Table.Cell>
                          {rwr.dataItems
                            .slice(0, spaceAvailable.value)
                            .map((item) => (
                              <Table.Cell>
                                {item ? `${item.name} = ${item.value}` : ''}
                              </Table.Cell>
                            ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {rwrOrdered.length > 0 && (
                <div>
                  <Graph
                    graph={graph}
                    options={options}
                    events={events}
                    // getNetwork={console.log}
                  />
                </div>
              )}
            </div>
          </div>
          <h3 style={{ marginLeft: '15px' }}>E-DCG+</h3>
          <div style={{ display: 'flex', marginBottom: 15 }}>
            <div style={{ marginLeft: '15px' }}>
              {rwrByGroup[0].length > 0 && (
                <>
                  <h3>Group 1</h3>
                  <ReactDataGrid
                    columns={Object.keys(rwrByGroup[0][0]).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => rwrByGroup[0][i]}
                    rowsCount={rwrByGroup[0].length}
                    rows={rwrByGroup[0]}
                  />
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {rwrByGroup[1].length > 0 && (
                <>
                  <h3>Group 2</h3>
                  <ReactDataGrid
                    columns={Object.keys(rwrByGroup[1][0]).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => rwrByGroup[1][i]}
                    rowsCount={rwrByGroup[1].length}
                    rows={rwrByGroup[1]}
                  />
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {rwrByGroup[0].length > 0 && (
                <>
                  <h3>Group 1 with RWR Ordered</h3>
                  <ReactDataGrid
                    columns={Object.keys(rwrByGroup[0][0]).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => rwrByGroup[0][i]}
                    rowsCount={rwrByGroup[0].length}
                    rows={sortedGroup1}
                  />
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {rwrByGroup[1].length > 0 && (
                <>
                  <h3>Group 2 with RWR Ordered</h3>
                  <ReactDataGrid
                    columns={Object.keys(rwrByGroup[1][0]).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => rwrByGroup[1][i]}
                    rowsCount={rwrByGroup[1].length}
                    rows={sortedGroup2}
                  />
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', marginBottom: 15 }}>
            <div style={{ marginLeft: '15px' }}>
              {rwrByGroup[0].length > 0 && (
                <>
                  <h3>Group 1</h3>
                  <ReactDataGrid
                    columns={Object.keys(rwrByGroup[0][0]).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => filteredGroup1[0][i]}
                    rowsCount={filteredGroup1[0].length}
                    rows={filteredGroup1}
                  />
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {rwrByGroup[1].length > 0 && (
                <>
                  <h3>Group 2</h3>
                  <ReactDataGrid
                    columns={Object.keys(rwrByGroup[1][0]).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => filteredGroup2[1][i]}
                    rowsCount={filteredGroup2[1].length}
                    rows={filteredGroup2}
                  />
                </>
              )}
            </div>
            <div style={{ marginLeft: '15px' }}>
              {/* {edafn.length > 0 && (
                <>
                  <h3>E-DAFN+</h3>
                  <Table celled padded>
                    <Table.Body>
                      {edafn.map((rwr) => (
                        <Table.Row>
                          <Table.Cell>
                            <strong>{rwr.hostName}</strong>
                          </Table.Cell>
                          {rwr.dataItems
                            .slice(0, spaceAvailable.value)
                            .map((item) => (
                              <Table.Cell>
                                {item ? `${item.name} = ${item.value}` : ''}
                              </Table.Cell>
                            ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </>
              )} */}
            </div>
            {/* <div style={{ marginLeft: '15px' }}>
              {rwrByGroup[0].length > 0 && (
                <>
                  <h3>Group 1 Replica</h3>
                  <ReactDataGrid
                    columns={Object.keys(rwrByGroup[0][0]).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => filteredGroup1[0][i]}
                    rowsCount={spaceAvailable.value}
                    rows={filteredGroup1.slice(0, spaceAvailable.value)}
                  />
                </>
              )}
            </div> */}
            {/* <div style={{ marginLeft: '15px' }}>
              {rwrByGroup[1].length > 0 && (
                <>
                  <h3>Group 2 Replica</h3>
                  <ReactDataGrid
                    columns={Object.keys(rwrByGroup[1][0]).map((val) => ({
                      key: val,
                      name: startCase(val),
                    }))}
                    rowGetter={(i) => filteredGroup2[1][i]}
                    rowsCount={spaceAvailable.value}
                    rows={filteredGroup2.slice(0, spaceAvailable.value)}
                  />
                </>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
