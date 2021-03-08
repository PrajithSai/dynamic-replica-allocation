import React, { useState } from 'react';
import { Header, Label, Button, Table, } from 'semantic-ui-react'
import Select from 'react-select'
import { filter, findIndex, cloneDeep } from 'lodash'
// import ProxyBased from './ProxyBased'
import 'semantic-ui-css/semantic.min.css'
import './App.scss'

const TIMER = 3000;

const mhMSSParents = {
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

const mhProxyParents = {
  "MH1": "Proxy 1",
  "MH2": "Proxy 1",
  "MH3": "Proxy 1",
  "MH4": "Proxy 1",
  "MH5": "Proxy 1",
  "MH6": "Proxy 1",
  "MH7": "Proxy 2",
  "MH8": "Proxy 2",
  "MH9": "Proxy 2",
}

const proxiesByMSS = {
  "MSS1": "Proxy 1",
  "MSS2": "Proxy 1",
  "MSS3": "Proxy 2",
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
  const [requestQueue, updateRequestQueue] = useState([])
  const [proxyGrantQueue, updateProxyGrantQueue] = useState([])
  const [mhProxyMovementsDict, updateMHProxyMovement] = useState(mhProxyParents)
  const [mhMSSMovementsDict, updateMHMSSMovement] = useState(mhMSSParents)
  const [mhToMove, setMHToMove] = useState({ label: "", value: "" })
  const [mssToMoveTo, setMssToMoveTo] = useState({ label: "", value: "" })
  
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

  const getMSSToMoveTo = () => {
    return [{ label: 'MSS1', value: 'MSS1' },
    { label: 'MSS2', value: 'MSS2' },
    { label: 'MSS3', value: 'MSS3' }].filter(mss => mss.value !== mhMSSMovementsDict[mhToMove.value])
  }

  const submitRequestToMSS = () => {
    const mss = mhMSSParents[tokenRequestSource.value]
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
  
  const submitRequestToProxy = () => {
    // const mss = mhMSSMovementsDict[tokenRequestSource.value]
    const proxy = mhProxyMovementsDict[tokenRequestSource.value]
    const queue = cloneDeep(requestQueue)
    const request = { h: tokenRequestSource.value, proxy, id: Date.now() }
    queue.push(request)
    updateRequestQueue(queue)
  }

  const getMHsByProxy = () => {
    const mhsByProxy = {
      "Proxy 1": [],
      "Proxy 2": []
    }
    Object.entries(mhProxyMovementsDict).map(([key, value] )=> {
      mhsByProxy[value].push(key)
    })
    return mhsByProxy
  }

  const getNewRequestQueue = () => {
    const newQueue = requestQueue.map(req => ({ ...req, proxy: mhProxyMovementsDict[req.h] }))
    return newQueue
  }

  const giveTokenToProxy = () => {
    // const mhsByProxy = getMHsByProxy()
    const updatedRequestQueue = getNewRequestQueue()
    const allRequestsInProxy = updatedRequestQueue.filter(req => req.proxy === tokenPosition.value)
    const newRequestQueue = updatedRequestQueue.filter(req => req.proxy !== tokenPosition.value)
    console.log({ newRequestQueue, allRequestsInProxy })
    updateRequestQueue(newRequestQueue)
    updateProxyGrantQueue(allRequestsInProxy)
    setTimeout(() => {
      serveRequestsInGrantQueue(allRequestsInProxy)
    }, TIMER);
  }

  const serveRequestsInGrantQueue = requests => {
    if (requests.length === 0) return;
    const reqClone = cloneDeep(requests)
    reqClone.shift()
    updateProxyGrantQueue(reqClone)
    setTimeout(() => {
      serveRequestsInGrantQueue(reqClone)
    }, TIMER);
  }

  const moveMHToMSS = () => {
    const mh = mhToMove.value
    const mss = mssToMoveTo.value
    const proxy = proxiesByMSS[mssToMoveTo.value];
    const mssMovement = cloneDeep(mhMSSMovementsDict)
    const proxyMovement = cloneDeep(mhProxyMovementsDict)
    mssMovement[mh] = mss
    proxyMovement[mh] = proxy
    updateMHProxyMovement(proxyMovement)
    updateMHMSSMovement(mssMovement)
  }

  const getMHsByMSS = (mssID) => {
    const mhs = []
    Object.entries(mhMSSMovementsDict).map(([mh, mss]) => {
      if (mss === mssID) mhs.push(mh)
    })
    return mhs
  }

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
          {mode.value === "PROXY" && <>
            <div>
              <div className="select-cache">
                <label>Select Request Source</label>
                <Select value={tokenRequestSource} onChange={setTokenRequestSource} options={getAllMHs()} />
              </div>
              <div className="select-cache cache-buttons">
                <Button primary onClick={submitRequestToProxy}>Submit Request</Button>
              </div>
            </div>
            <div>
              <Header as="h3">Move MH</Header>
              <div className="select-cache">
                <label>Select MH</label>
                <Select value={mhToMove} onChange={setMHToMove} options={getAllMHs()} />
              </div>
              <div className="select-cache">
                <label>Select MSS</label>
                <Select value={mssToMoveTo} onChange={setMssToMoveTo} options={getMSSToMoveTo()} />
              </div>
              <div className="select-cache cache-buttons">
                <Button primary onClick={moveMHToMSS}>Move</Button>
              </div>
            </div>
            <div>
              <div className="select-cache">
                <label>Select Token Location</label>
                <Select value={tokenPosition} onChange={setTokenPosition} options={[{label: "Proxy 1", value: "Proxy 1"},{label: "Proxy 2", value: "Proxy 2"}]} />
              </div>
              <div className="select-cache cache-buttons">
                {tokenPosition.value && <Button secondary onClick={giveTokenToProxy}>Give Token Access To {tokenPosition.value}</Button>}
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
        <div style={{display: "flex" }}>
          <div id="treeWrapper" style={{ marginLeft: "15px"}}>
            <div className="ring">
              <div className="proxy-1">
                <Header as="h3" textAlign="center" style={{ marginTop: 15 }}>Proxy 1</Header>
                <div className="mss-1-container">
                  <div className="nodes">
                    <div className="mss"><Label>MSS1</Label></div>
                    <div>
                      {getMHsByMSS("MSS1").map(mh => <div key={mh} className="mhs"><Label>{mh}</Label></div>)}
                    </div>
                  </div>
                </div>
                <div className="mss-2-container">
                  <div className="nodes">
                    <div className="mss"><Label>MSS2</Label></div>
                    <div>
                      {getMHsByMSS("MSS2").map(mh => <div key={mh} className="mhs"><Label>{mh}</Label></div>)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="proxy-2">
              <Header as="h3"  textAlign="center" style={{ marginTop: 15 }}>Proxy 2</Header>
              <div className="mss-3-container">
                <div className="nodes">
                  <div className="mss"><Label>MSS3</Label></div>
                  <div>
                    {getMHsByMSS("MSS3").map(mh => <div key={mh} className="mhs"><Label>{mh}</Label></div>)}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
          <div className="local-queues">
            <>
              <Header as='h3'>
                Request Queue
              </Header>
                <div style={{ margin: "20px" }}>
                  <Table celled padded>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell singleLine>MH</Table.HeaderCell>
                        <Table.HeaderCell>Proxy</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                    {requestQueue.map(req => (
                        <Table.Row key={req.id}>
                          <Table.Cell>
                            {req.h}
                          </Table.Cell>
                          <Table.Cell singleLine>{req.proxy}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
            </>
            <>
              <Header as='h3'>
                Grant Queue
              </Header>
                <div style={{ margin: "20px" }}>
                  <Table celled padded>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell singleLine>MH</Table.HeaderCell>
                        <Table.HeaderCell>Proxy</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                    {proxyGrantQueue.map(req => (
                        <Table.Row key={req.id}>
                          <Table.Cell>
                            {req.h}
                          </Table.Cell>
                          <Table.Cell singleLine>{req.proxy}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
            </>
          </div>
        </div>
          </div>}
      </div>
    </div>
  );
}

export default App;
