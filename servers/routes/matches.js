// ADD match result handling
router.put('/:id/result', async (req, res) => {
  const { score1, score2, winner } = req.body;
  
  // Update match in MongoDB
  const match = await Match.findByIdAndUpdate(
    req.params.id,
    { 
      score1, 
      score2, 
      winner,
      status: 'completed',
      completed_at: new Date()
    },
    { new: true }
  );
  
  // Automatically advance winner to next round
  const tournament = await Tournament.findById(match.tournamentId);
  const updatedBracket = BracketManager.advanceWinner(tournament.bracketData, match.id, winner);
  
  // Save updated bracket
  await Tournament.findByIdAndUpdate(match.tournamentId, {
    bracketData: updatedBracket
  });
  
  res.json(match);
});
