import { RoleImpersonationSelectorInterface } from '.'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { RoleImpersonationController } from '@/state/role-impersonation-state'

vi.mock('./UserImpersonationSelector', () => ({
  UserImpersonationSelector: ({ disabled }: { disabled?: boolean }) => (
    <fieldset data-testid="user-settings" disabled={disabled}>
      <button type="button" tabIndex={0}>
        Project
      </button>
    </fieldset>
  ),
}))

describe('RoleImpersonationSelectorInterface', () => {
  it('uses the compact role layout and enables user settings for authenticated queries', () => {
    const setRole = vi.fn()
    const state: RoleImpersonationController = {
      role: undefined,
      claims: undefined,
      setRole,
    }

    render(<RoleImpersonationSelectorInterface state={state} compact />)

    expect(screen.getByRole('radio', { name: 'PostgresSuperuser' })).toBeChecked()
    expect(screen.getByTestId('user-settings')).toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: 'AuthenticatedLogged-in user' }))

    expect(screen.getByTestId('user-settings')).not.toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: 'AnonymousNot logged in' }))

    expect(setRole).toHaveBeenCalledWith({ type: 'postgrest', role: 'anon' })
    expect(screen.getByTestId('user-settings')).toBeDisabled()
  })
})
