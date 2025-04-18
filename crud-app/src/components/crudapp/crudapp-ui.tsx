'use client'

import { PublicKey } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import {
  useCrudappProgram,
  useCrudappProgramAccount,
} from './crudapp-data-access'
import { useWallet } from '@solana/wallet-adapter-react'

export function CrudappCreate() {
  const [description, setDescription] = useState('')
  const { createTodoItem } = useCrudappProgram()
  const { publicKey } = useWallet()

  const allowCreate = !!publicKey && !!description

  const handleCreate = () => {
    if (!allowCreate) {
      return
    }
    const title = Math.random().toString(36).substring(2, 15)
    createTodoItem.mutateAsync({ title, description, owner: publicKey })
  }

  if (!publicKey) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Connect your wallet to create a todo item</span>
      </div>
    )
  }

  return (
    <div className="form-control">
      <input
        type="text"
        className="input input-bordered"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        className="btn btn-xs lg:btn-md btn-primary"
        onClick={handleCreate}
        disabled={createTodoItem.isPending}
      >
        Create {createTodoItem.isPending && '...'}
      </button>
    </div>
  )
}

export function CrudappList() {
  const { accounts, getProgramAccount } = useCrudappProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <CrudappCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No Todo Items</h2>
          Create one above to get started.
        </div>
      )}
    </div>
  )
}

function CrudappCard({ account }: { account: PublicKey }) {
  const { accountQuery, updateTodoItem, deleteTodoItem } =
    useCrudappProgramAccount({
      account,
    })

  const { publicKey } = useWallet()

  useEffect(() => {
    if (accountQuery.data) {
      setDescription(accountQuery.data.description)
      setCompleted(accountQuery.data.completed)
    }
  }, [accountQuery.data])

  const [description, setDescription] = useState(accountQuery.data?.description)
  const [completed, setCompleted] = useState(accountQuery.data?.completed)
  const [requiresUpdate, setRequiresUpdate] = useState(false)

  const allowUpdate = !!publicKey && !!description

  if (accountQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!accountQuery.data) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Account not found</span>
      </div>
    )
  }

  const handleUpdate = () => {
    if (!allowUpdate) {
      return
    }
    updateTodoItem.mutateAsync({
      title: accountQuery.data.title,
      description: description ?? '',
      completed: completed ?? false,
      owner: publicKey,
    })
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">{accountQuery.data.title}</h2>
        <input
          type="text"
          className="input input-bordered"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setRequiresUpdate(true)
          }}
        />
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => {
            setCompleted(e.target.checked)
            setRequiresUpdate(true)
          }}
        />

        {requiresUpdate ? (
          <button
            className="btn btn-xs lg:btn-md btn-primary"
            onClick={handleUpdate}
            disabled={updateTodoItem.isPending}
          >
            Update {updateTodoItem.isPending && '...'}
          </button>
        ) : (
          <button
            className="btn btn-xs lg:btn-md btn-primary"
            onClick={() => deleteTodoItem.mutateAsync(accountQuery.data.title)}
            disabled={deleteTodoItem.isPending}
          >
            Delete {deleteTodoItem.isPending && '...'}
          </button>
        )}
      </div>
    </div>
  )
}
