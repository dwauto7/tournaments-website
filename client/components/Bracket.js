// MODIFY to use bracket-manager data
import { BracketDisplay } from 'bracket-manager/react';

const TournamentBracket = ({ tournament }) => {
  return (
    <div className="bracket-container">
      <BracketDisplay 
        bracket={tournament.bracketData}
        onMatchClick={(match) => setSelectedMatch(match)}
      />
      
      {selectedMatch && (
        <MatchScoreInput 
          match={selectedMatch}
          onSubmitScores={(scores) => updateMatchScores(selectedMatch.id, scores)}
        />
      )}
    </div>
  );
};
