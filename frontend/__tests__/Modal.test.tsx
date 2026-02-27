import { render, screen } from '@testing-library/react'
import { Modal } from '../components/Modal'
import userEvent from '@testing-library/user-event'

describe('Modal Component', () => {
  it('renders modal when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )
    
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )
    
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    const closeButton = screen.getByRole('button', { name: '' })
    await user.click(closeButton)
    
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    const backdrop = screen.getByText('Modal Content').parentElement?.parentElement?.parentElement
    if (backdrop) {
      await user.click(backdrop)
      expect(handleClose).toHaveBeenCalled()
    }
  })

  it('renders with custom title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Custom Title">
        <div>Modal Content</div>
      </Modal>
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('does not close when clicking inside modal content', async () => {
    const handleClose = jest.fn()
    const user = userEvent.setup()
    
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    )
    
    const content = screen.getByText('Modal Content')
    await user.click(content)
    
    expect(handleClose).not.toHaveBeenCalled()
  })
})
