import { forwardRef, InputHTMLAttributes, useState, useEffect, ChangeEvent } from 'react'

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string
  error?: string
  helperText?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

// Format phone number as +7 (XXX) XXX-XX-XX
const formatPhone = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  // Ensure starts with 7 (Russia)
  let phone = digits
  if (phone.startsWith('8')) {
    phone = '7' + phone.slice(1)
  } else if (!phone.startsWith('7') && phone.length > 0) {
    phone = '7' + phone
  }
  
  // Limit to 11 digits (7 + 10 digits)
  phone = phone.slice(0, 11)
  
  // Format
  if (phone.length === 0) return ''
  if (phone.length <= 1) return `+${phone}`
  if (phone.length <= 4) return `+${phone[0]} (${phone.slice(1)}`
  if (phone.length <= 7) return `+${phone[0]} (${phone.slice(1, 4)}) ${phone.slice(4)}`
  if (phone.length <= 9) return `+${phone[0]} (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`
  return `+${phone[0]} (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`
}

// Extract raw digits from formatted phone
const extractDigits = (formatted: string): string => {
  return formatted.replace(/\D/g, '')
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, helperText, className = '', value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')
    
    // Sync with external value
    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatPhone(value))
      }
    }, [value])
    
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value)
      setDisplayValue(formatted)
      
      // Create a synthetic event with the raw value for form handling
      if (onChange) {
        const rawValue = extractDigits(formatted)
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: rawValue ? `+${rawValue}` : ''
          }
        } as ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }
    
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
          placeholder="+7 (___) ___-__-__"
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput



