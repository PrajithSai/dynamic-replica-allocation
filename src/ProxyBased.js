import React, { useState } from 'react'
import { Header, Label, Button, Table, } from 'semantic-ui-react'
import { filter, findIndex, cloneDeep } from 'lodash'

const initialMSSQueues = {
  "MSS1": [],
  "MSS2": [],
  "MSS3": [],
}

export default function ProxyBased() {
  const [requestQueue, updateRequestQueue] = useState([])
  const [proxyLocalQueues, updateProxyLocalQueues] = useState(initialMSSQueues)
  return (<>
    <div style={{display: "flex" }}>
      <div id="treeWrapper" style={{ width: '70%', marginLeft: "15px"}}>
        <div className="ring">
          <div className="proxy-1">
            <Header as="h3" textAlign="center" style={{ marginTop: 15 }}>Proxy 1</Header>
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
          </div>
          <div className="proxy-2">
          <Header as="h3"  textAlign="center" style={{ marginTop: 15 }}>Proxy 2</Header>
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
      </div>
      <div className="local-queues" style={{ width: '30%'}}>
        {Object.keys([]).map(queue => (
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
                {{}[queue].map(req => (
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
    </div>
  </>)
}