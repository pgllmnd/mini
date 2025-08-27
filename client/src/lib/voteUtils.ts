type VoteType = 'up' | 'down';
type ApiVoteType = 'UP' | 'DOWN' | null;

interface VoteState {
  upvotes: number;
  downvotes: number;
  my_vote: ApiVoteType;
}

// Helper to handle removing a vote
function removeVote(state: VoteState, voteType: VoteType): VoteState {
  return {
    ...state,
    my_vote: null,
    upvotes: voteType === 'up' ? state.upvotes - 1 : state.upvotes,
    downvotes: voteType === 'down' ? state.downvotes - 1 : state.downvotes
  };
}

// Helper to handle switching vote type
function switchVoteType(state: VoteState, newType: VoteType): VoteState {
  const wasUpvote = state.my_vote === 'UP';
  const isUpvote = newType === 'up';
  
  return {
    ...state,
    my_vote: newType.toUpperCase() as ApiVoteType,
    upvotes: state.upvotes + (isUpvote ? 1 : (wasUpvote ? -1 : 0)),
    downvotes: state.downvotes + (isUpvote ? (wasUpvote ? 0 : -1) : 1)
  };
}

// Helper to handle adding a new vote
function addNewVote(state: VoteState, voteType: VoteType): VoteState {
  return {
    ...state,
    my_vote: voteType.toUpperCase() as ApiVoteType,
    upvotes: voteType === 'up' ? state.upvotes + 1 : state.upvotes,
    downvotes: voteType === 'down' ? state.downvotes + 1 : state.downvotes
  };
}

export function calculateNewVoteState(
  currentState: VoteState,
  newVoteType: VoteType
): VoteState {
  // Same vote type clicked - remove vote
  if (currentState.my_vote === newVoteType.toUpperCase()) {
    return removeVote(currentState, newVoteType);
  }
  
  // Has existing vote - switch type
  if (currentState.my_vote) {
    return switchVoteType(currentState, newVoteType);
  }
  
  // No existing vote - add new vote
  return addNewVote(currentState, newVoteType);
}