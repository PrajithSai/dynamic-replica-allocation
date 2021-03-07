import React, { useState } from 'react';
import { Header, Label, Button } from 'semantic-ui-react'
import Select from 'react-select'
import { filter, findIndex, cloneDeep } from 'lodash'
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

const initialMSSQueues = {
  "MSS1": [],
  "MSS2": [],
  "MSS3": [],
  "MSS4": [],
}

function App() {
  const [mode, setMode] = useState({ label: "", value: "" })
  const [tokenRequestSource, setTokenRequestSource] = useState({ label: "", value: "" })
  const [mhCounters, setMHCounter] = useState(initialMHCounters)
  const [localQueues, updateLocalQueues] = useState(initialMSSQueues)

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
    const mss = mhParents[tokenRequestSource.value]
    const mhCountersClone = {...mhCounters}
    const h_count = mhCounters[tokenRequestSource.value] + 1;
    const h = tokenRequestSource.value;
    const queue = cloneDeep(localQueues)
    const request = { h, h_count, id: Date.now(), isDeliverable: false, mss, priority: null }
    queue[mss].push(request)
    mhCountersClone[h] = h_count
    setMHCounter(mhCountersClone)
    updateLocalQueues(queue)
    // console.log("After submitting request: ", {mhCounters: mhCountersClone, localQueues: queue})
    getReqPriorityFromAllMSS(request, queue)
    setTokenRequestSource({ label: "", value: "" })
  }

  const getReqPriorityFromAllMSS = (request, q) => {
    const queue = cloneDeep(q)
    // console.log({ localQueues })
    const allMSSExceptSource = Object.keys(initialMSSQueues).filter(mss => mss !== request.mss)
    const highestHCounts = []
    for (let i = 0; i < allMSSExceptSource.length; i += 1) {
      const currentMss = allMSSExceptSource[i]
      let maxPriority = Math.max(...queue[currentMss].map(req => req.priority || 0))
      // console.log({ maxPriority })
      maxPriority = maxPriority > 0 ? maxPriority : 0 
      queue[currentMss].push({ ...request, priority: maxPriority + 1 })
      highestHCounts.push(maxPriority + 1)
      updateLocalQueues(queue)
    }
    assignGlobalPriorityToReq(request, highestHCounts, queue)
  }

  const assignGlobalPriorityToReq = (request, hCounts, q) => {
    const queue = cloneDeep(q)
    const maxHCount = Math.max(...hCounts)
    const index = findIndex(queue[request.mss], { id: request.id })
    queue[request.mss][index].priority = maxHCount
    queue[request.mss][index].isDeliverable = true
    updateLocalQueues(queue)
    broadcastPriorityToAllMSS(request, maxHCount, queue)
  } 

  const broadcastPriorityToAllMSS = (request, maxHCount, q) => {
    const queue = cloneDeep(q)
    const allMSSExceptSource = Object.keys(initialMSSQueues).filter(mss => mss !== request.mss)
    for (let i = 0; i < allMSSExceptSource.length; i += 1) {
      const currentMss = allMSSExceptSource[i]
      const index = findIndex(queue[currentMss], { id: request.id })
      queue[currentMss][index].priority = maxHCount
      queue[currentMss][index].isDeliverable = true
      updateLocalQueues(queue)
    }
  }
  console.log({ localQueues, mhCounters })
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
        {mode.value === "REPLICATION" && <div>
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
        </div>}
      </div>
    </div>
  );
}

export default App;
