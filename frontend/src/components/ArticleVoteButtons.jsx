import React, { useState, useEffect } from 'react';
import { HStack, Button, Text } from './ui';
import { votesAPI } from '../services/api';

const ArticleVoteButtons = ({ article, compact = false }) => {
  const [voteScore, setVoteScore] = useState(article.vote_score || 0);
  const [voteStatus, setVoteStatus] = useState({ has_voted: false, vote_count: 0, vote_type: null });
  const [isVoting, setIsVoting] = useState(false);

  // Fetch vote status when component mounts
  useEffect(() => {
    if (article?.id) {
      votesAPI.getStatus(article.id)
        .then(response => {
          setVoteStatus(response.data);
          setVoteScore(response.data.vote_score || article.vote_score || 0);
        })
        .catch(err => {
          console.error('Error fetching vote status:', err);
        });
    }
  }, [article?.id]);

  const handleVote = async (voteType) => {
    if (!article?.id || isVoting) return;

    setIsVoting(true);
    try {
      await votesAPI.create({
        article: article.id,
        vote_type: voteType,
      });
      
      // Update vote status and score
      const response = await votesAPI.getStatus(article.id);
      setVoteStatus(response.data);
      setVoteScore(response.data.vote_score || voteScore);
    } catch (err) {
      console.error('Error voting:', err);
    } finally {
      setIsVoting(false);
    }
  };

  if (compact) {
    return (
      <HStack spacing={2} align="center">
        <Button
          size="xs"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleVote('up');
          }}
          disabled={isVoting}
          className="min-w-auto px-2 py-1 hover:bg-green-50"
          title="Upvote"
        >
          👍
        </Button>
        <Text size="xs" className="text-gray-600 font-medium min-w-[2ch] text-center">
          {voteScore}
        </Text>
        <Button
          size="xs"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleVote('down');
          }}
          disabled={isVoting}
          className="min-w-auto px-2 py-1 hover:bg-red-50"
          title="Downvote"
        >
          👎
        </Button>
      </HStack>
    );
  }

  return (
    <HStack spacing={2} align="center">
      <Button
        size="xs"
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleVote('up');
        }}
        disabled={isVoting}
        className={`min-w-auto px-2 py-1 hover:bg-green-50 ${
          voteStatus.vote_type === 'up' ? 'bg-green-100' : ''
        }`}
        title="Upvote"
      >
        👍
      </Button>
      <Text size="xs" className="text-gray-600 font-medium min-w-[2ch] text-center">
        {voteScore}
      </Text>
      <Button
        size="xs"
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleVote('down');
        }}
        disabled={isVoting}
        className={`min-w-auto px-2 py-1 hover:bg-red-50 ${
          voteStatus.vote_type === 'down' ? 'bg-red-100' : ''
        }`}
        title="Downvote"
      >
        👎
      </Button>
    </HStack>
  );
};

export default ArticleVoteButtons;

