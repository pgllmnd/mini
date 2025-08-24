CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags VARCHAR(50)[] NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  question_id INTEGER REFERENCES questions(id),
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  vote_type VARCHAR(4) NOT NULL CHECK (vote_type IN ('up', 'down')),
  target_type VARCHAR(8) NOT NULL CHECK (target_type IN ('question', 'answer')),
  target_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, target_type, target_id)
);
