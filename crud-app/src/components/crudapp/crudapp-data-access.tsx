'use client'

import { getCrudappProgram, getCrudappProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export interface CreateTodoItemArgs {
  title: string
  description: string
  owner: PublicKey
}

export interface UpdateTodoItemArgs {
  title: string
  description: string
  completed: boolean
  owner: PublicKey
}

export interface DeleteTodoItemArgs {
  title: string
  owner: PublicKey
}

export function useCrudappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(
    () => getCrudappProgramId(cluster.network as Cluster),
    [cluster]
  )
  const program = useMemo(
    () => getCrudappProgram(provider, programId),
    [provider, programId]
  )

  const accounts = useQuery({
    queryKey: ['crudapp', 'all', { cluster }],
    queryFn: () => program.account.todoItemState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createTodoItem = useMutation<string, Error, CreateTodoItemArgs>({
    mutationKey: ['todoItem', 'create', { cluster }],
    mutationFn: async ({ title, description }) => {
      return program.methods.createTodoItem(title, description).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: (error) =>
      toast.error(`Failed to create todo item ${error.message}`),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createTodoItem,
  }
}

export function useCrudappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCrudappProgram()

  const accountQuery = useQuery({
    queryKey: ['crudapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.todoItemState.fetch(account),
  })

  const updateTodoItem = useMutation<string, Error, UpdateTodoItemArgs>({
    mutationKey: ['todoItem', 'update', { cluster }],
    mutationFn: async ({ title, description, completed }) => {
      return program.methods.updateTodoItem(title, description, completed).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: (error) =>
      toast.error(`Failed to update todo item ${error.message}`),
  })

  const deleteTodoItem = useMutation({
    mutationKey: ['todoItem', 'delete', { cluster }],
    mutationFn: (title: string) => {
      return program.methods.deleteTodoItem(title).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: (error) =>
      toast.error(`Failed to delete todo item ${error.message}`),
  })

  return {
    accountQuery,
    updateTodoItem,
    deleteTodoItem,
  }
}
