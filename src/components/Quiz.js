import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://wordgame-backend-2sza.onrender.com/api';

function Quiz({ token }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchQuizData = async () => {
    setLoading(true);
    try {
      const [statusRes, statsRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/quiz/status`, axiosConfig),
        axios.get(`${API_BASE}/quiz/stats`, axiosConfig),
        axios.get(`${API_BASE}/quiz/history?page=0&size=10`, axiosConfig)
      ]);
      setStatus(statusRes.data);
      setStats(statsRes.data);
      setHistory(historyRes.data.content || []);
      
      if (!statusRes.data.completedToday) {
        const quizRes = await axios.get(`${API_BASE}/quiz/today`, axiosConfig);
        setQuestions(quizRes.data);
      }
    } catch (error) {
      console.error('Error fetching quiz data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizData();
  }, []);

  const handleAnswer = (questionId, selectedOption) => {
    setAnswers({ ...answers, [questionId]: selectedOption });
  };

  const handleSubmit = async () => {
    const answerList = questions.map(q => ({
      questionId: q.questionId,
      selectedOption: answers[q.questionId],
      timeTakenMs: 5000
    }));

    try {
      const response = await axios.post(`${API_BASE}/quiz/submit`, { answers: answerList }, axiosConfig);
      setResult(response.data);
      fetchQuizData();
    } catch (error) {
      alert('Error submitting quiz: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalQuizzes || 0}</div>
          <div className="stat-label">Total Quizzes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.averageScore || 0}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalXp || 0}</div>
          <div className="stat-label">Total XP</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.currentStreak || 0}</div>
          <div className="stat-label">Current Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Level {stats?.level || 1}</div>
          <div className="stat-label">Level</div>
        </div>
      </div>

      {result && (
        <div className="card" style={{ background: '#e8f5e9' }}>
          <h3>Quiz Results</h3>
          <p>Score: {result.score}/{result.totalPossible} ({result.percentage}%)</p>
          <p>XP Earned: {result.xpEarned}</p>
          <p>Message: {result.message}</p>
          <button className="btn btn-primary" onClick={() => setResult(null)}>Close</button>
        </div>
      )}

      {status?.completedToday && !result && (
        <div className="card" style={{ background: '#fff3e0' }}>
          <h3>You've already completed today's quiz!</h3>
          <p>Come back tomorrow for more XP!</p>
        </div>
      )}

      {!status?.completedToday && questions.length > 0 && !result && (
        <div className="card">
          <h3>Today's Quiz</h3>
          {questions.map((q, idx) => (
            <div key={q.questionId} style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '10px' }}>
              <h4>Question {idx + 1}: {q.word}</h4>
              <p>What does "{q.word}" mean?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {q.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`question_${q.questionId}`}
                        value={letter}
                        onChange={() => handleAnswer(q.questionId, letter)}
                        checked={answers[q.questionId] === letter}
                      />
                      <strong>{letter}.</strong> {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== questions.length}
          >
            Submit Quiz
          </button>
        </div>
      )}

      <div className="card">
        <h3>Quiz History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>XP Earned</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.attemptId}>
                <td>{new Date(h.completedAt).toLocaleDateString()}</td>
                <td>{h.score}/{h.totalPossible}</td>
                <td>{h.percentage}%</td>
                <td>{h.xpEarned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Quiz;