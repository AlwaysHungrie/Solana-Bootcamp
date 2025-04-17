import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/votingdapp'
import { BankrunProvider, startAnchor } from 'anchor-bankrun'
import { ProgramTestContext } from 'solana-bankrun'
const IDL = require('../target/idl/votingdapp.json')

const votingAddress = new PublicKey("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

describe('votingdappan', () => {
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let votingProgram: Program<Voting>;
  let pollId: anchor.BN;
  beforeEach(async () => {
    context = await startAnchor("", [{
      name: "votingdapp",
      programId: votingAddress,
    }], []);
    provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(
      IDL,
      provider
    )

    pollId = new anchor.BN(1);
    const description = "Test Poll";
    const pollStartTime = new anchor.BN(Date.now());
    const pollEndTime = new anchor.BN(Date.now() + 1000 * 60 * 60 * 24); // 1 day
    const pollCandidateAmount = new anchor.BN(2);
    
    await votingProgram.methods.initializePoll(
      pollId,
      description,
      pollStartTime,
      pollEndTime,
      pollCandidateAmount
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(pollId).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(pollAddress.toBase58());
    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("Test Poll");
    expect(poll.pollStartTime.toNumber()).toBeLessThan(pollEndTime.toNumber());
    expect(poll.pollCandidateAmount.toNumber()).toEqual(pollCandidateAmount.toNumber());
  })


  it('should initialize a candidate', async () => {
    await votingProgram.methods.initializeCandidate(
      "candidate1",
      pollId
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "candidate2",
      pollId
    ).rpc();

    const [candidate1Address] = PublicKey.findProgramAddressSync(
      [Buffer.from("candidate1"), pollId.toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const [candidate2Address] = PublicKey.findProgramAddressSync(
      [Buffer.from("candidate2"), pollId.toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const candidate1 = await votingProgram.account.candidate.fetch(candidate1Address);
    const candidate2 = await votingProgram.account.candidate.fetch(candidate2Address);

    console.log(candidate1);
    console.log(candidate2);
    
    expect(candidate1.candidateName).toEqual("candidate1");
    expect(candidate2.candidateName).toEqual("candidate2");
    expect(candidate1.candidateVotes.toNumber()).toEqual(0);
    expect(candidate2.candidateVotes.toNumber()).toEqual(0);
    
  })

  it('should vote for a candidate', async () => {
    await votingProgram.methods.initializeCandidate(
      "candidate1",
      pollId
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "candidate2",
      pollId
    ).rpc();
    
    await votingProgram.methods.vote(
      "candidate1",
      pollId
    ).rpc();

    const [candidate1Address] = PublicKey.findProgramAddressSync(
      [Buffer.from("candidate1"), pollId.toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const candidate1 = await votingProgram.account.candidate.fetch(candidate1Address);
    expect(candidate1.candidateVotes.toNumber()).toEqual(1);

    await votingProgram.methods.vote(
      "candidate1",
      pollId
    ).rpc();

    const candidate1AfterVote = await votingProgram.account.candidate.fetch(candidate1Address);
    expect(candidate1AfterVote.candidateVotes.toNumber()).toEqual(2);
  })
})
