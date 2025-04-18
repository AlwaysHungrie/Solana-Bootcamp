#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

declare_id!("2mWXq2NSvptkbkFNvmBstU6GuT461BYYbKrzK57mmmt2");

#[program]
pub mod crudapp {
  use super::*;

  pub fn create_todo_item(ctx: Context<CreateTodoItem>, title: String, description: String) -> Result<()> {
    let todo_item = &mut ctx.accounts.todo_item;
    todo_item.owner = *ctx.accounts.owner.key;
    todo_item.title = title;
    todo_item.description = description;
    todo_item.completed = false;
    Ok(())
  }

  pub fn update_todo_item(ctx: Context<UpdateTodoItem>, _title: String, description: String, completed: bool) -> Result<()> {
    let todo_item = &mut ctx.accounts.todo_item;
    todo_item.description = description;
    todo_item.completed = completed;

    Ok(())
  }

  pub fn delete_todo_item(_ctx: Context<DeleteTodoItem>, _title: String) -> Result<()> {
    Ok(())
  }
}

#[account]
#[derive(InitSpace)]
pub struct TodoItemState {
  pub owner: Pubkey,
  #[max_len(32)]
  pub title: String,
  #[max_len(256)]
  pub description: String,
  pub completed: bool,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateTodoItem<'info> {
  #[account(mut)]
  pub owner: Signer<'info>,
  #[account(
    init,
    seeds = [title.as_bytes(), owner.key().as_ref()],
    bump,
    space = ANCHOR_DISCRIMINATOR_SIZE + TodoItemState::INIT_SPACE,
    payer = owner,
  )]
  pub todo_item: Account<'info, TodoItemState>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateTodoItem<'info> {
  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(
    mut,
    seeds = [title.as_bytes(), owner.key().as_ref()],
    bump,
    realloc = 8 + TodoItemState::INIT_SPACE,
    realloc::payer = owner,
    realloc::zero = true,
  )]
  pub todo_item: Account<'info, TodoItemState>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteTodoItem<'info> {
  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(
    mut,
    seeds = [title.as_bytes(), owner.key().as_ref()],
    bump,
    close = owner,
  )]
  pub todo_item: Account<'info, TodoItemState>,
  pub system_program: Program<'info, System>,
}
