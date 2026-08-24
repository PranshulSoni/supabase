import { Check } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Separator,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { AnonIcon, AuthenticatedIcon, ServiceRoleIcon } from './Icons'
import { RoleImpersonationRadio } from './RoleImpersonationRadio'
import { UserImpersonationSelector } from './UserImpersonationSelector'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'
import { PostgrestRole } from '@/lib/role-impersonation'
import {
  useRoleImpersonationStateSnapshot,
  type RoleImpersonationController,
} from '@/state/role-impersonation-state'

export interface RoleImpersonationSelectorProps {
  header?: string
  serviceRoleLabel?: string
  disallowAuthenticatedOption?: boolean
  title?: string
  orientation?: 'horizontal' | 'vertical'
  compact?: boolean
}

/**
 * Tightly coupled with the global role impersonation store
 * Use RoleImpersonationSelectorInterface to control the logic externally
 */
export const RoleImpersonationSelector = (props: RoleImpersonationSelectorProps) => {
  // valtio's Snapshot<> type is deep-readonly (incl. nested arrays), which isn't
  // structurally assignable to RoleImpersonationController's plain array fields — same
  // rationale as the cast in useGetImpersonatedRoleState.
  const state = useRoleImpersonationStateSnapshot() as unknown as RoleImpersonationController

  return <RoleImpersonationSelectorInterface {...props} state={state} />
}

type RoleImpersonationSelectorInterfaceProps = RoleImpersonationSelectorProps & {
  state: RoleImpersonationController
}

export const RoleImpersonationSelectorInterface = ({
  state,
  orientation,
  compact = false,
  serviceRoleLabel = 'Postgres',
  disallowAuthenticatedOption = false,
  header = 'Impersonate a database role',
}: RoleImpersonationSelectorInterfaceProps) => {
  const isVertical = orientation === 'vertical'

  const [selectedOption, setSelectedOption] = useState<PostgrestRole>(() =>
    state.role?.type === 'postgrest' &&
    (state.role.role === 'anon' || state.role.role === 'authenticated')
      ? state.role.role
      : 'service_role'
  )

  const isAuthenticatedOptionFullySelected = Boolean(
    selectedOption === 'authenticated' &&
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    (('user' in state.role && state.role.user) ||
      ('externalAuth' in state.role && state.role.externalAuth)) // Check for either auth type
  )

  function onSelectedChange(value: PostgrestRole) {
    if (value === 'service_role') {
      // do not set a role for service role
      // as the default role is the "service role"
      state.setRole(undefined)
    }

    if (value === 'anon') {
      state.setRole({
        type: 'postgrest',
        role: value,
      })
    }

    setSelectedOption(value)
  }

  if (compact) {
    return (
      <div className="flex flex-col p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
          }}
        >
          <FormItemLayout isReactForm={false} layout="horizontal" size="tiny" label="Role">
            <ToggleGroup
              type="single"
              orientation="vertical"
              value={selectedOption}
              onValueChange={(value) => {
                if (value) onSelectedChange(value as PostgrestRole)
              }}
              variant="default"
              aria-label="Run query as role"
              className="w-full flex-col items-stretch gap-0.5"
            >
              <ToggleGroupItem value="service_role" className="w-full justify-between text-left">
                <span className="flex min-w-0 flex-col items-start">
                  <span>{serviceRoleLabel === 'postgres' ? 'Postgres' : serviceRoleLabel}</span>
                  <span className="text-xs font-normal text-foreground-lighter">Superuser</span>
                </span>
                {selectedOption === 'service_role' && <Check size={14} />}
              </ToggleGroupItem>

              <ToggleGroupItem value="anon" className="w-full justify-between text-left">
                <span className="flex min-w-0 flex-col items-start">
                  <span>Anonymous</span>
                  <span className="text-xs font-normal text-foreground-lighter">Not logged in</span>
                </span>
                {selectedOption === 'anon' && <Check size={14} />}
              </ToggleGroupItem>

              {!disallowAuthenticatedOption && (
                <ToggleGroupItem value="authenticated" className="w-full justify-between text-left">
                  <span className="flex min-w-0 flex-col items-start">
                    <span>Authenticated</span>
                    <span className="text-xs font-normal text-foreground-lighter">
                      Logged-in user
                    </span>
                  </span>
                  {selectedOption === 'authenticated' && <Check size={14} />}
                </ToggleGroupItem>
              )}
            </ToggleGroup>
          </FormItemLayout>

          {!disallowAuthenticatedOption && (
            <>
              <Separator className="my-2.5" />
              <UserImpersonationSelector
                state={state}
                compact
                disabled={selectedOption !== 'authenticated'}
              />
            </>
          )}
        </form>
      </div>
    )
  }

  return (
    <Card className="border-none">
      <CardHeader className="flex-row items-center justify-between py-3 space-y-0">
        <CardTitle>{header}</CardTitle>
        <DocsButton
          href={`${DOCS_URL}/guides/database/postgres/row-level-security#authenticated-and-unauthenticated-roles`}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        <form
          onSubmit={(e) => {
            // don't allow form submission
            e.preventDefault()
          }}
        >
          <fieldset className={cn('flex gap-3', isVertical && 'flex-col gap-2')}>
            <RoleImpersonationRadio
              value="service_role"
              isSelected={selectedOption === 'service_role'}
              onSelectedChange={onSelectedChange}
              label={serviceRoleLabel}
              description="Superuser"
              icon={<ServiceRoleIcon isSelected={selectedOption === 'service_role'} />}
              fullWidth={isVertical}
            />

            <RoleImpersonationRadio
              value="anon"
              label="Anonymous"
              isSelected={selectedOption === 'anon'}
              onSelectedChange={onSelectedChange}
              description="Not logged in"
              icon={<AnonIcon isSelected={selectedOption === 'anon'} />}
              fullWidth={isVertical}
            />

            {!disallowAuthenticatedOption && (
              <RoleImpersonationRadio
                value="authenticated"
                label="Authenticated"
                isSelected={
                  selectedOption === 'authenticated' &&
                  (isAuthenticatedOptionFullySelected || 'partially')
                }
                onSelectedChange={onSelectedChange}
                description="Specific logged in user"
                icon={<AuthenticatedIcon isSelected={selectedOption === 'authenticated'} />}
                fullWidth={isVertical}
              />
            )}
          </fieldset>
        </form>

        {selectedOption === 'service_role' && (
          <div>
            <p className="text-sm">
              Full admin access
              <Badge className="ml-2">Default</Badge>
            </p>
            <p className="text-foreground-light text-sm">
              The <code className="text-code-inline">postgres</code> role, which bypasses all Row
              Level Security (RLS) policies.
            </p>
          </div>
        )}

        {selectedOption === 'anon' && (
          <div>
            <p className="text-sm">For unauthenticated access</p>
            <p className="text-foreground-light text-sm">
              The <code className="text-code-inline">anon</code> role, which the API (PostgREST)
              uses when a user is not logged in.
              <br />
              Row Level Security (RLS) policies apply.
            </p>
          </div>
        )}

        {selectedOption === 'authenticated' && (
          <div>
            <p className="text-sm">For authenticated access</p>
            <p className="text-foreground-light text-sm">
              The <code className="text-code-inline">authenticated</code> role, which the API
              (PostgREST) uses when a user is logged in.
              <br />
              Row Level Security (RLS) policies apply.
            </p>
          </div>
        )}
      </CardContent>

      {selectedOption === 'authenticated' && (
        <CardContent className="p-0">
          <UserImpersonationSelector state={state} />
        </CardContent>
      )}
    </Card>
  )
}
