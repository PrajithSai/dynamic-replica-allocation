import React, { useState } from 'react';
import { Header, Label, Button, Table } from 'semantic-ui-react';
import Select from 'react-select';
import { filter, findIndex, cloneDeep } from 'lodash';
import ReactDataGrid from 'react-data-grid';
import 'semantic-ui-css/semantic.min.css';
import './App.scss';

const TIMER = 3000;

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
  const [replicas, setReplicas] = useState({});

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
    for (let i = 1; i <= 6; i += 1) {
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
    console.log({ reads, writes });
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
            <Button primary onClick={startReplication}>
              Start Replication
            </Button>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <div id="treeWrapper" style={{ marginLeft: '15px' }}>
            {rwr.length > 0 && (
              <ReactDataGrid
                columns={[
                  { key: 'hostName', name: 'Host' },
                  { key: 'dataItemName', name: 'Data Item' },
                  { key: 'rwr', name: 'RWR' },
                ]}
                // rowGetter={(i) => rwr[i]}
                rows={rwr}
                rowsCount={rwr.length}
                minHeight={150}
              />
            )}
          </div>
          <div className="local-queues" style={{ width: '30%' }}></div>
        </div>
      </div>
    </div>
  );
}

export default App;
