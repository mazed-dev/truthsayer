import React, { useState, useRef } from 'react'

import { Link, useHistory } from 'react-router-dom'
import { Button, Form, ListGroup, Modal } from 'react-bootstrap'

import { uploadLocalFile } from './UploadLocalFile'

import { Emoji } from '../lib/Emoji'
import { goto } from '../lib/route'
import { debug } from '../util/log'
import { jcss } from '../util/jcss'
import { smuggler, CancelToken } from 'smuggler-api'
import { Optional } from '../util/types'

import UploadImg from '../img/upload-strip.svg'

import styles from './UploadNodeButton.module.css'

type UploadNodeButtonProps = {
  className: string
  from_nid: Optional<string>
  to_nid: Optional<string>
}

export const UploadNodeButton = React.forwardRef<
  HTMLButtonElement,
  UploadNodeButtonProps
>(({ children, className, from_nid, to_nid, ...kwargs }, ref) => {
  className = jcss(styles.btn, className)
  children = children || (
    <img
      src={UploadImg}
      className={styles.new_btn_img}
      alt="Upload from file"
    />
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button
        className={className}
        ref={ref}
        onClick={(e) => {
          e.preventDefault()
          const { current } = fileInputRef
          if (current) {
            // Triger click on <input type="file"> component to open a file selection dialog directly
            current!.click()
          }
        }}
        {...kwargs}
      >
        {children}
      </Button>
      <UploadFilesForm
        from_nid={from_nid || null}
        to_nid={to_nid || null}
        ref={fileInputRef}
      />
    </>
  )
})

type UploadFilesFormProps = {
  from_nid: Optional<string>
  to_nid: Optional<string>
}

const UploadFilesForm = React.forwardRef<
  HTMLInputElement,
  UploadFilesFormProps
>(({ from_nid, to_nid, ...kwargs }, ref) => {
  const [show, setShow] = useState(false)
  const [items, setItems] = useState<JSX.Element[]>([])
  const history = useHistory()

  const handleFileInputChange = () => {
    const files = ref?.current?.files
    if (!files) {
      return
    }
    const uploadItems: JSX.Element[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i)
      uploadItems.push(
        <FileUploadStatus
          file={file}
          from_nid={from_nid || null}
          to_nid={to_nid || null}
          onClick={onClose}
          key={`upd-item-${i}`}
        />
      )
    }
    setShow(true)
    setItems(uploadItems)
  }

  const onClose = () => {
    setShow(false)
    setItems([])
    goto.reload(history)
  }

  return (
    <>
      <Form className={styles.hide}>
        <Form.Control
          type="file"
          multiple
          isValid
          ref={ref}
          onChange={handleFileInputChange}
        />
      </Form>
      <Modal show={show} size={'lg'} scrollable centered onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title className={styles.uploaded_files_title}>
            Uploaded files
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.uploaded_files_body}>
          <ul className={styles.files_list}>{items}</ul>
        </Modal.Body>
      </Modal>
    </>
  )
})

type FileUploadStatusProps = {
  file: File
  from_nid: Optional<string>
  to_nid: Optional<string>
  onClick: () => void
}

export type FileUploadStatusState = {
  progress: number
  nid: Optional<string>
  error: Optional<string>
}

class FileUploadStatus extends React.Component<
  FileUploadStatusProps,
  FileUploadStatusState
> {
  cancelToken: CancelToken

  constructor(props: FileUploadStatusProps) {
    super(props)
    this.state = {
      progress: 0.0,
      nid: null,
      error: null,
    }
    this.cancelToken = smuggler.makeCancelToken()
  }

  componentDidMount() {
    const { file, from_nid, to_nid } = this.props
    uploadLocalFile(
      file,
      from_nid || null,
      to_nid || null,
      this.updateState,
      this.cancelToken.token
    )
  }

  componentWillUnmount() {
    this.cancelToken.cancel()
  }

  updateState = (upd: FileUploadStatusState) => {
    this.setState(upd)
  }

  onClick = () => {
    this.props.onClick()
  }

  render() {
    const { file } = this.props
    const { nid, progress, error } = this.state
    let status
    let filename
    if (nid) {
      status = <Emoji symbol="✅" label="uploaded" />
      filename = (
        <Link to={`/n/${nid}`} onClick={this.onClick}>
          {file.name}
        </Link>
      )
    } else {
      status = <Emoji symbol="⌛" label="upload in progress" />
    }
    let statusMsg
    if (!error) {
      statusMsg = `${Math.round(progress * 100)}%`
    } else {
      status = <Emoji symbol="❌" label="failed" />
      statusMsg = error
    }
    return (
      <li {...this.props}>
        <ListGroup horizontal="sm" className={styles.files_list_item_group}>
          <ListGroup.Item>
            <span role="img" aria-label="status">
              {status}
            </span>
          </ListGroup.Item>
          <ListGroup.Item>{statusMsg}</ListGroup.Item>
          <ListGroup.Item>{filename}</ListGroup.Item>
        </ListGroup>
      </li>
    )
  }
}
