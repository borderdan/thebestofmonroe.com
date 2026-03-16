import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QRGenerator } from '../qr-generator'

// Mock qrcode.react to avoid SVG rendering complexities in tests
vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <div data-testid="mock-qr">{value}</div>
}))

describe('QRGenerator Component', () => {
  it('renders a QR code and base URL correctly', () => {
    render(<QRGenerator city="mexico-city" slug="la-esquina" locale="es" />)
    
    // Check if URL text is rendered
    expect(screen.getAllByText(/la-esquina/i).length).toBeGreaterThan(0)
    
    // Ensure the mocked QR code gets the right value
    const qrCode = screen.getByTestId('mock-qr')
    expect(qrCode).toHaveTextContent('/es/mexico-city/la-esquina')
    
    // Check if table ID text is not rendered
    expect(screen.queryByText(/Mesa/i)).not.toBeInTheDocument()
  })

  it('renders the table ID when provided', () => {
    render(<QRGenerator city="mexico-city" slug="la-esquina" locale="es" tableId="4" />)
    
    // Check if table ID text is rendered
    expect(screen.getByText('Mesa #4')).toBeInTheDocument()
    
    // Ensure the mock QR code gets the table ID query parameter
    const qrCode = screen.getByTestId('mock-qr')
    expect(qrCode).toHaveTextContent('table=4')
  })
})
