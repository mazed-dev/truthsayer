import React from 'react'

import { Button, Container, Form, ListGroup } from 'react-bootstrap'

import PropTypes from 'prop-types'
import { Link, withRouter } from 'react-router-dom'

import { Emoji } from '../Emoji'

import { smugler } from '../smugler/api'
import { debug } from '../util/log'
import { MimeType } from '../util/Mime'

import { exctractDoc } from '../doc/doc_util'

import styles from './UploadFileAsNode.module.css'

const uuid = require('uuid')

class UploadFile extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      uploads: [], // [{filename: "", nid: "", local_id: "some local id", progress: 1.0, error: null}]
    }
    this.fileInputRef = React.createRef()
    this.cancelTokens = []
  }

  componentWillUnmount() {
    this.cancelTokens.forEach((token) => token.cancel())
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  handleChange = () => {
    this.submitFilesWithAttrs(this.fileInputRef.current.files)
  }

  handleLinkUploads = () => {}

  submitFilesWithAttrs = (files) => {
    const new_uploads = []
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i)
      debug('File', file)
      const localId = uuid.v4()
      new_uploads.push({
        filename: file.name,
        local_id: localId,
        nid: null,
        progress: 0.0,
      })
      const updateStatus = (upd) => this.updateFileStatus(localId, upd)
      if (file.size > 2000000) {
        updateStatus({
          error: `reading failed: file is too big ( ${file.size} > 2MiB)`,
        })
      }
      const contextType = MimeType.parse(file.type)
      const cancelToken = smugler.makeCancelToken()
      this.cancelTokens.push(cancelToken)
      if (contextType.isText()) {
        readLocalTextFile(file, updateStatus, cancelToken.token)
      } else {
        smugler.blob
          .upload({ files: [file], cancelToken: cancelToken.token })
          .then((resp) => {
            if (resp) {
              const nid = resp.nids[0]
              updateStatus({ nid, progress: 1.0 })
            }
          })
          .catch((err) => updateStatus({ error: `Submission failed: ${err}` }))
      }
    }
    this.setState({
      uploads: this.state.uploads.concat(new_uploads),
    })
  }

  updateFileStatus = (localId, upd) => {
    this.setState((state) => {
      const uploads = this.state.uploads
      const ind = uploads.findIndex((item) => {
        return item.local_id === localId
      })
      if (!(ind < 0)) {
        Object.assign(uploads[ind], upd)
        return {
          uploads,
        }
      }
      return {}
    })
  }

  render() {
    // TODO(akindyakov): Continue here
    // Connect items button
    // https://github.com/atlassian/react-beautiful-dnd
    const uploads = this.state.uploads.map((item) => {
      let status = <Emoji symbol="⌛" label="upload in progress" />
      let name = item.filename
      if (item.nid !== null) {
        status = <Emoji symbol="✅" label="uploaded" />
        name = <Link to={`/n/${item.nid}`}>{name}</Link>
      }
      let msg = `${Math.round(item.progress * 100)}%`
      if (item.error) {
        status = <Emoji symbol="❌" label="failed" />
        msg = item.error
      }
      return (
        <li key={item.local_id}>
          <ListGroup horizontal="sm" className={styles.files_list_item_group}>
            <ListGroup.Item>
              <span role="img" aria-label="status">
                {status}
              </span>
            </ListGroup.Item>
            <ListGroup.Item>{msg}</ListGroup.Item>
            <ListGroup.Item>{name}</ListGroup.Item>
          </ListGroup>
        </li>
      )
    })
    const link_uploads_enabled = this.state.uploads.length !== 0 && false // Not implemented, yet
    return (
      <Container>
        <Form>
          <Form.File id="upload-notes-from-files" custom>
            <Form.File.Input
              multiple
              isValid
              onChange={this.handleChange}
              ref={this.fileInputRef}
            />
            <Form.File.Label data-browse="Button text">
              Select local files to upload...
            </Form.File.Label>
          </Form.File>
        </Form>
        <Button
          variant="secondary"
          disabled={!link_uploads_enabled}
          onClick={link_uploads_enabled ? this.handleLinkUploads : null}
          className="m-2"
        >
          Connect uploaded
        </Button>
        <ul className={styles.files_list}>{uploads}</ul>
      </Container>
    )
  }
}

function readLocalTextFile(file, updateStatus, cancelToken) {
  const reader = new FileReader()
  reader.onload = (event) => {
    debug('Loaded to memory', event)
    const appendix = `\n---\n*From file - "${file.name}" (\`${
      Math.round((file.size * 100) / 1024) * 100
    }KiB\`)*\n`
    const text = event.target.result + appendix
    exctractDoc(text).then((doc) => {
      smugler.node
        .create({ doc, cancelToken })
        .then((node) => {
          if (node) {
            const nid = node.nid
            updateStatus({ nid, progress: 1.0 })
          }
        })
        .catch((err) => updateStatus({ error: `Submission failed: ${err}` }))
    })
  }

  reader.onerror = (event) => {
    updateStatus({
      error: `reading failed: ${reader.error}`,
    })
  }

  reader.onabort = (event) => {
    updateStatus({
      error: `reading aborted: ${reader.abort}`,
    })
  }

  reader.onprogress = (event) => {
    if (event.loaded && event.total) {
      const percent = (event.loaded / event.total) * 0.5
      updateStatus({ progress: percent })
    }
  }

  reader.readAsText(file)
}

export default withRouter(UploadFile)
