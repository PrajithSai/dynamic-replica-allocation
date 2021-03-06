import React, { useState } from 'react';
import { Header, Label, Button } from 'semantic-ui-react'
import Select from 'react-select'
// import { filter, findIndex, cloneDeep } from 'lodash'
import 'semantic-ui-css/semantic.min.css'
import './App.scss'

const mhParents = {
  "MH1": "MSS1",
  "MH2": "MSS1",
  "MH3": "MSS1",
  "MH4": "MSS2",
  "MH5": "MSS2",
  "MH6": "MSS2",
  "MH7": "MSS3",
  "MH8": "MSS3",
  "MH9": "MSS3",
  "MH10": "MSS4",
  "MH11": "MSS4",
  "MH12": "MSS4",
}

const initialMHCounters = {
  "MH1": 0,
  "MH2": 0,
  "MH3": 0,
  "MH4": 0,
  "MH5": 0,
  "MH6": 0,
  "MH7": 0,
  "MH8": 0,
  "MH9": 0,
  "MH10": 0,
  "MH11": 0,
  "MH12": 0,
}

function App() {
  const [mode, setMode] = useState({ label: "", value: "" })
  const [tokenRequestSource, setTokenRequestSource] = useState({ label: "", value: "" })
  const [mhCounters, setMHCounter] = useState(initialMHCounters)
  const [localQueues, updateLocalQueues] = useState([])

  const getModeOptions = () => {
    return [{
      label: "Proxy-based",
      value: "PROXY"
    },{
      label: "Data Replication-based",
      value: "REPLICATION"
    },
    ]
  }

  const getAllMHs = () => {
    const allMHs = []
    for (let i = 1; i <= 12; i += 1) {
      allMHs.push({
        label: `MH${i}`,
        value: `MH${i}`
      })
    }
    return allMHs
  }

  const submitRequestToMSS = () => {
    const h_count = mhCounters[tokenRequestSource.value] + 1;
    const h = tokenRequestSource.value;
    const queue = [...localQueues]
    const request = { h, h_count } 
    queue.push(request)
    broadcastRequestToAllMSS(request)
  }

  const broadcastRequestToAllMSS = (request) => {
    
  }

  return (
    <div className="App">
      <div className="App-div" style={{ margin: '15px', padding: '15px', display: 'flex' }}>
        <div style={{ width: "30%", height: '100vh', borderRight: '1px solid silver' }}>
          <Header as="h3">Select Mode</Header>
          <div className="select-cache">
            <label>Mode</label>
            <Select value={mode} onChange={setMode} options={getModeOptions()} />
          </div>
          <div className="select-cache">
            <label>Select Request Source</label>
            <Select value={tokenRequestSource} onChange={setTokenRequestSource} options={getAllMHs()} />
            {/* {tokenRequestSource.value && mhParents[tokenRequestSource.value]} */}
          </div>
          <div className="select-cache cache-buttons">
              <Button secondary onClick={submitRequestToMSS}>Submit Request</Button>
            </div>
        </div>
        <div id="treeWrapper" style={{ width: '70%', height: '35em' }}>
          <div className="ring">
            <div className="mss-1-container">
              <div className="nodes">
                <div className="mss"><Label>MSS1</Label></div>
                <div>
                  <div className="mhs"><Label>MH1</Label></div>
                  <div className="mhs"><Label>MH2</Label></div>
                  <div className="mhs"><Label>MH3</Label></div>
                </div>
              </div>
            </div>
            <div className="mss-2-container">
              <div className="nodes">
                <div className="mss"><Label>MSS2</Label></div>
                <div>
                  <div className="mhs"><Label>MH4</Label></div>
                  <div className="mhs"><Label>MH5</Label></div>
                  <div className="mhs"><Label>MH6</Label></div>
                </div>
              </div>
            </div>
            <div className="mss-3-container">
              <div className="nodes">
                <div className="mss"><Label>MSS3</Label></div>
                <div>
                  <div className="mhs"><Label>MH7</Label></div>
                  <div className="mhs"><Label>MH8</Label></div>
                  <div className="mhs"><Label>MH9</Label></div>
                </div>
              </div>
            </div>
            <div className="mss-4-container">
              <div className="nodes">
                <div className="mss"><Label>MSS4</Label></div>
                <div>
                  <div className="mhs"><Label>MH10</Label></div>
                  <div className="mhs"><Label>MH11</Label></div>
                  <div className="mhs"><Label>MH12</Label></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
