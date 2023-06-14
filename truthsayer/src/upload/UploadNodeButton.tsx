import React, { useState, useRef } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import { Button, Form, ListGroup, Modal } from 'react-bootstrap'

import { uploadLocalFile } from './UploadLocalFile'

import { Emoji } from '../lib/Emoji'
import { jcss } from 'elementary'
import { Optional } from 'armoury'

import UploadImg from '../img/upload-strip.svg'

import styles from './UploadNodeButton.module.css'
import MzdGlobalContext from '../lib/global'

type UploadNodeButtonProps = React.PropsWithChildren<{
  className: string
  from_nid: Optional<string>
  to_nid: Optional<string>
}>

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
            // Triger click on <input type="file"> component to open a file
            // selection dialog directly.
            current!.click()
          }
        }}
        {...kwargs}
      >
        {children}
      </Button>
      <UploadFileAsNodeForm
        from_nid={from_nid || undefined}
        to_nid={to_nid || undefined}
        ref={fileInputRef}
      />
    </>
  )
})

type UploadFilesFormProps = {
  from_nid?: string
  to_nid?: string
}

export const UploadFileAsNodeForm = React.forwardRef<
  HTMLInputElement,
  UploadFilesFormProps
>(({ from_nid, to_nid }, ref) => {
  const [show, setShow] = useState(false)
  const [items, setItems] = useState<JSX.Element[]>([])
  const navigate = useNavigate()

  const handleFileInputChange = () => {
    // @ts-ignore: Property 'current' does not exist on type '(instance: HTMLInputElement | null) => void'
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
    navigate('/empty')
    navigate(-1)
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
  nid?: string
  error?: string
}

class FileUploadStatus extends React.Component<
  FileUploadStatusProps,
  FileUploadStatusState
> {
  static contextType = MzdGlobalContext
  context!: React.ContextType<typeof MzdGlobalContext>

  abortControler: AbortController

  constructor(props: FileUploadStatusProps) {
    super(props)
    this.state = {
      progress: 0.0,
      nid: undefined,
      error: undefined,
    }
    this.abortControler = new AbortController()
  }

  componentDidMount() {
    const { file, from_nid, to_nid } = this.props
    uploadLocalFile(
      this.context.storage,
      file,
      from_nid || null,
      to_nid || null,
      this.updateState,
      this.abortControler.signal
    )
  }

  componentWillUnmount() {
    this.abortControler.abort()
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
