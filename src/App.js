import React, { useState } from 'react';
import { Header, Label, Button, Table, } from 'semantic-ui-react'
import Select from 'react-select'
import { filter, findIndex, cloneDeep } from 'lodash'
import ProxyBased from './ProxyBased'
import 'semantic-ui-css/semantic.min.css'
import './App.scss'

const TIMER = 0;

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
}

const initialMSSQueues = {
  "MSS1": [],
  "MSS2": [],
  "MSS3": [],
}

function App() {
  const [mode, setMode] = useState({ label: "", value: "" })
  const [tokenRequestSource, setTokenRequestSource] = useState({ label: "", value: "" })
  const [mhCounters, setMHCounter] = useState(initialMHCounters)
  const [localQueues, updateLocalQueues] = useState(initialMSSQueues)
  const [tokenPosition, setTokenPosition] = useState({ label: "", value: "" })

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
    for (let i = 1; i <= 9; i += 1) {
      allMHs.push({
        label: `MH${i}`,
        value: `MH${i}`
      })
    }
    return allMHs
  }

  const getAllMSS = () => Object.keys(initialMSSQueues).map(mss => ({ label: mss, value: mss }))

  const submitRequestToMSS = () => {
    const mss = mhParents[tokenRequestSource.value]
    const mhCountersClone = {...mhCounters}
    const h_count = mhCounters[tokenRequestSource.value] + 1;
    const h = tokenRequestSource.value;
    const queue = cloneDeep(localQueues)
    const request = { h, h_count, id: Date.now(), isDeliverable: null, mss, priority: null }
    queue[mss].push(request)
    mhCountersClone[h] = h_count
    setMHCounter(mhCountersClone)
    updateLocalQueues(queue)
    // console.log("After submitting request: ", {mhCounters: mhCountersClone, localQueues: queue})
    setTokenRequestSource({ label: "", value: "" })
    setTimeout(() => {
      gatherReqPriorityFromAllMSS(request, queue)
    }, TIMER);
  }

  const gatherReqPriorityFromAllMSS = (request, q) => {
    const queue = cloneDeep(q)
    // console.log({ localQueues })
    const allMSSExceptSource = Object.keys(initialMSSQueues).filter(mss => mss !== request.mss)
    const highestHCounts = []
    for (let i = 0; i < allMSSExceptSource.length; i += 1) {
      const currentMss = allMSSExceptSource[i]
      let maxPriority = Math.max(...queue[currentMss].map(req => req.priority || 0))
      // console.log({ maxPriority })
      maxPriority = maxPriority > 0 ? maxPriority : 0 
      queue[currentMss].push({ ...request, priority: maxPriority + 1, isDeliverable: false })
      highestHCounts.push(maxPriority + 1)
      updateLocalQueues(queue)
    }
    setTimeout(() => {
      assignGlobalPriorityToReq(request, highestHCounts, queue)
    }, TIMER);
  }

  const assignGlobalPriorityToReq = (request, hCounts, q) => {
    const queue = cloneDeep(q)
    const maxHCount = Math.max(...hCounts)
    const index = findIndex(queue[request.mss], { id: request.id })
    queue[request.mss][index].priority = maxHCount
    queue[request.mss][index].isDeliverable = true
    updateLocalQueues(queue)
    setTimeout(() => {
      broadcastPriorityToAllMSS(request, maxHCount, queue)
    }, TIMER);
  } 

  const broadcastPriorityToAllMSS = (request, maxHCount, q) => {
    const queue = cloneDeep(q)
    const allMSSExceptSource = Object.keys(initialMSSQueues).filter(mss => mss !== request.mss)
    for (let i = 0; i < allMSSExceptSource.length; i += 1) {
      const currentMss = allMSSExceptSource[i]
      const index = findIndex(queue[currentMss], { id: request.id })
      queue[currentMss][index].priority = maxHCount
      queue[currentMss][index].isDeliverable = true
      console.log("test", { currentMss, value: queue[currentMss][index] })
    }
    updateLocalQueues(queue)
  }

  const giveTokenToSelectedMSS = () => {
    const currentMss = tokenPosition.value
    const allRequests = filter(localQueues[currentMss], { mss: currentMss })
    allRequests.map(releaseRequestAtLocalMSS)
  }

  const releaseRequestAtLocalMSS = (request) => {
    const queue = cloneDeep(localQueues)
    if (request.h_count === mhCounters[request.h]) {
      queue[request.mss] = queue[request.mss].filter(req => req.id !== request.id)
      updateLocalQueues(queue)
      setTimeout(() => {
        releaseRequestAtAllMSS(request, queue)
      }, TIMER);
      setTokenPosition({ label: "", value: "" })
    }
  }

  const releaseRequestAtAllMSS = (request, q) => {
    const queue = cloneDeep(q)
    const allMSSExceptSource = Object.keys(initialMSSQueues).filter(mss => mss !== request.mss)
    for (let i = 0; i < allMSSExceptSource.length; i += 1) {
      const currentMss = allMSSExceptSource[i]
      queue[currentMss] = queue[currentMss].filter(req => req.id !== request.id)
    }
    updateLocalQueues(queue)
  }
  // console.log({ localQueues, mhCounters })
  return (
    <div className="App">
      <div className="App-div" style={{ margin: '15px', padding: '15px', display: 'flex' }}>
        <div style={{ width: "20%", height: '100vh', borderRight: '1px solid silver' }}>
          <Header as="h3">Select Mode</Header>
          <div className="select-cache">
            <label>Mode</label>
            <Select value={mode} onChange={setMode} options={getModeOptions()} />
          </div>
          {mode.value === "REPLICATION" && <>
            <div>
              <div className="select-cache">
                <label>Select Request Source</label>
                <Select value={tokenRequestSource} onChange={setTokenRequestSource} options={getAllMHs()} />
              </div>
              <div className="select-cache cache-buttons">
                <Button primary onClick={submitRequestToMSS}>Submit Request</Button>
              </div>
            </div>
            <div>
              <div className="select-cache">
                <label>Select Token Location</label>
                <Select value={tokenPosition} onChange={setTokenPosition} options={getAllMSS()} />
              </div>
              <div className="select-cache cache-buttons">
                {tokenPosition.value && <Button secondary onClick={giveTokenToSelectedMSS}>Give Token Access To {tokenPosition.value}</Button>}
              </div>
            </div>
          </>}
        </div>
        {mode.value === "REPLICATION" && <div style={{display: "flex" }}>
          <div id="treeWrapper" style={{ width: '70%', marginLeft: "15px"}}>
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
            </div>
          </div>
          <div className="local-queues" style={{ width: '30%'}}>
            {Object.keys(localQueues).map(queue => (
              <div key={queue} style={{ margin: "20px" }}>
                <Header as='h3'>
                  {queue}
                </Header>
                <Table celled padded >
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell singleLine>MH</Table.HeaderCell>
                      <Table.HeaderCell>H_Count</Table.HeaderCell>
                      <Table.HeaderCell>Deliverable</Table.HeaderCell>
                      <Table.HeaderCell>Priority</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {localQueues[queue].map(req => (
                      <Table.Row key={req.id}>
                        <Table.Cell>
                            {req.h}
                        </Table.Cell>
                        <Table.Cell singleLine>{req.h_count}</Table.Cell>
                        <Table.Cell singleLine>{req.isDeliverable === null ? "N/A" : req.isDeliverable === true ? "Yes" : "No"}</Table.Cell>
                        <Table.Cell singleLine>{req.priority === null ? "N/A" : req.priority}</Table.Cell>
                    </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            ))}
          </div>
        </div>}
        {mode.value === "PROXY" && <div>
              <ProxyBased />
          </div>}
      </div>
    </div>
  );
}

export default App;
