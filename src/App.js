import React, { useState } from 'react';
import { Header, Label, Button } from 'semantic-ui-react';
import Select from 'react-select';
import { filter, findIndex, cloneDeep, groupBy, sortBy } from 'lodash';
import Table from './Table';
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
  const [rwr, setRWRs] = useState([]);
  const [esaf, setESAF] = useState({});
  const initialTableData = Object.values(groupBy(rwr, 'dataItemName'));

  const getAllSpaceAvailableOptions = (startAt = 2) => {
    const options = [];
    for (let i = startAt; i <= 10; i += 1) {
      options.push({ label: i, value: i });
    }
    return options;
  };

  function getRandomArbitrary(min = 0.1, max = 1) {
    return Math.random() * (max - min) + min;
  }

  const createMobileHostsAndDataItemsByReads = (numberOfDataItems) => {
    const hosts = {};
    for (let i = 1; i <= MH_LENGTH; i += 1) {
      const hostName = `M${i}`;
      hosts[hostName] = {};
      for (let j = 1; j <= numberOfDataItems; j += 1) {
        const dataItemName = `D${j}`;
        const readProbability = getRandomArbitrary().toFixed(2);
        hosts[hostName][dataItemName] = { readProbability };
      }
    }
    // console.log('out', hosts);
    return hosts;
  };

  const createDataItemsByWrites = (numberOfDataItems) => {
    const dataItems = {};
    for (let i = 1; i <= numberOfDataItems; i += 1) {
      const dataItem = `D${i}`;
      const writeProbability = getRandomArbitrary().toFixed(2);
      dataItems[dataItem] = { writeProbability };
    }
    // console.log('out', dataItems);
    return dataItems;
  };

  const getRWR = (reads, writes, numberOfDataItems) => {
    // console.log({ reads, writes });
    const rwrs = [];
    for (let i = 1; i <= 6; i += 1) {
      const hostName = `M${i}`;
      for (let j = 1; j <= numberOfDataItems; j += 1) {
        const temp = {};
        const dataItemName = `D${j}`;
        temp.hostName = hostName;
        temp.dataItemName = dataItemName;
        temp.rwr =
          Number(reads[hostName][dataItemName]['readProbability']) /
          Number(writes[dataItemName]['writeProbability']);
        temp.rwr = temp.rwr.toFixed(2);
        temp.rwrText = `${dataItemName} = ${temp.rwr}`;
        temp.id = `${i}_${j}`;
        rwrs.push(temp);
      }
    }
    // console.log({ reads, writes, rwrs });
    return rwrs;
  };

  const startReplication = () => {
    // console.log({ numberOfDataItems, spaceAvailable });
    const hostsAndDataItemsByReads = createMobileHostsAndDataItemsByReads(
      numberOfDataItems.value
    );
    const dataItemsByWrites = createDataItemsByWrites(numberOfDataItems.value);
    const rwr = getRWR(
      hostsAndDataItemsByReads,
      dataItemsByWrites,
      numberOfDataItems.value
    );
    setRWRs(rwr);
  };

  const showESAF = () => {
    // console.log({ rwr, initialTableData });
    const sortedRWRs = sortBy(rwr, [(i) => Number(i.rwr)]).reverse();
    const esaf = groupBy(sortedRWRs, 'hostName');
    const esafSorted = {};
    for (let i = 1; i <= MH_LENGTH; i += 1) {
      const hostName = `M${i}`;
      const dataItemName = `D${i}`;
      const ownDataItem = filter(esaf[hostName], { dataItemName });
      const otherDataItems = esaf[hostName].filter(
        (item) => item.dataItemName !== dataItemName
      );
      esafSorted[hostName] = [...ownDataItem, ...otherDataItems];
    }
    setESAF(esafSorted);
    console.log({ esafSorted });
    // setESAF(Object.values(groupBy(sortedRWRs, 'dataItemName')));
  };

  const getESAFColumns = () => {
    const columns = [];
    for (let i = 1; i <= MH_LENGTH; i += 1) {
      const hostName = `M${i}`;
      columns.push({ hostName });
    }
    return columns;
  };

  const getESAFRows = () => {
    const rows = [];
    for (let i = 0; i < MH_LENGTH; i += 1) {
      const row = [];
      for (let j = 0; j < MH_LENGTH; j += 1) {
        const hostName = `M${j + 1}`;
        // const temp = esaf[hostName];
        // console.log(temp);
        row.push(esaf[hostName][i]);
      }
      rows.push(row);
    }
    // console.log(rows);
    return rows;
  };

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
            borderRight: '1px solid silver',
          }}
        >
          <Header as="h3">Dynamic Replica allocation</Header>
          <div className="select-cache">
            <label style={{ fontSize: 16 }}>Space available at each node</label>
            <Select
              value={spaceAvailable}
              onChange={setSpaceAvailable}
              options={getAllSpaceAvailableOptions()}
            />
          </div>
          <div className="select-cache">
            <label style={{ fontSize: 16 }}>Number of data items</label>
            <Select
              value={numberOfDataItems}
              onChange={setNumberOfDataItems}
              options={getAllSpaceAvailableOptions(1)}
            />
          </div>
          <div className="select-cache cache-buttons">
            <Button style={{ width: '60%' }} primary onClick={startReplication}>
              Show RWRs
            </Button>
          </div>
          <div className="select-cache cache-buttons">
            <Button style={{ width: '60%' }} secondary onClick={showESAF}>
              Show E-SAF+
            </Button>
          </div>
          <div className="select-cache cache-buttons">
            <Button
              style={{ width: '60%' }}
              color="violet"
              onClick={console.log}
            >
              Show E-DAFN+
            </Button>
          </div>
          <div className="select-cache cache-buttons">
            <Button
              style={{ width: '60%' }}
              color="green"
              onClick={console.log}
            >
              Show E-DCG+
            </Button>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', marginBottom: 15 }}>
            {initialTableData.length > 0 && (
              <div id="treeWrapper" style={{ marginLeft: '15px' }}>
                <h3>RWR values</h3>
                <Table rows={initialTableData} columns={initialTableData[0]} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', marginBottom: 15 }}>
            {Object.values(esaf).length > 0 && (
              <div id="treeWrapper" style={{ marginLeft: '15px' }}>
                <h3>Data Items with Ordered RWR</h3>
                <Table rows={getESAFRows()} columns={getESAFColumns()} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
